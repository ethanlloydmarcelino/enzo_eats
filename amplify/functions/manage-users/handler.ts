import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminGetUserCommand,
  AdminListGroupsForUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import type { AppSyncResolverEvent, AppSyncIdentityCognito } from 'aws-lambda'
import { assertRoleChange, managedRoles, roleOf } from './permissions'
const client = new CognitoIdentityProviderClient({})
const UserPoolId = process.env.USER_POOL_ID!
const groupsFor = async (Username: string) => {
  const groups: string[] = []
  let NextToken: string | undefined
  do {
    const page = await client.send(
      new AdminListGroupsForUserCommand({ UserPoolId, Username, NextToken }),
    )
    groups.push(
      ...(page.Groups ?? []).flatMap((group) => (group.GroupName ? [group.GroupName] : [])),
    )
    NextToken = page.NextToken
  } while (NextToken)
  return groups
}
export const handler = async (
  event: AppSyncResolverEvent<{
    nextToken?: string
    emailPrefix?: string
    username?: string
    role?: string
  }>,
) => {
  const identity = event.identity as AppSyncIdentityCognito | undefined
  const actor = identity?.username
  if (!actor) throw new Error('NOT_AUTHORIZED')
  // Re-check current membership: an old access token cannot administer users after demotion.
  const actorGroups = await groupsFor(actor)
  if (!['admin', 'super_admin'].includes(roleOf(actorGroups))) throw new Error('NOT_AUTHORIZED')
  const args = event.arguments
  if (args.username !== undefined) {
    if (!args.username || args.username.length > 128) throw new Error('INVALID_USER')
    const target = await client.send(
      new AdminGetUserCommand({ UserPoolId, Username: args.username }),
    )
    const username = target.Username!
    const targetGroups = await groupsFor(username)
    assertRoleChange(actor, username, actorGroups, targetGroups, args.role ?? '')
    await client.send(
      new AdminAddUserToGroupCommand({ UserPoolId, Username: username, GroupName: args.role }),
    )
    for (const group of managedRoles) {
      if (group !== args.role && targetGroups.includes(group))
        await client.send(
          new AdminRemoveUserFromGroupCommand({ UserPoolId, Username: username, GroupName: group }),
        )
    }
    const currentGroups = await groupsFor(username)
    if (
      roleOf(currentGroups) !== args.role ||
      managedRoles.some((group) => group !== args.role && currentGroups.includes(group))
    )
      throw new Error('ROLE_UPDATE_INCOMPLETE')
    console.info('USER_ROLE_CHANGED', {
      actor,
      target: username,
      previousRole: roleOf(targetGroups),
      role: args.role,
      at: new Date().toISOString(),
    })
    return { username, groups: currentGroups, role: roleOf(currentGroups) }
  }
  const prefix = args.emailPrefix?.trim() ?? ''
  if (prefix.length > 254 || /[\u0000-\u001f]/.test(prefix)) throw new Error('INVALID_SEARCH')
  const escaped = prefix.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const page = await client.send(
    new ListUsersCommand({
      UserPoolId,
      Limit: 20,
      PaginationToken: args.nextToken || undefined,
      Filter: prefix ? 'email ^= "' + escaped + '"' : undefined,
    }),
  )
  const users = await Promise.all(
    (page.Users ?? []).map(async (user) => {
      const attr = (key: string) =>
        user.Attributes?.find((value) => value.Name === key)?.Value ?? ''
      const groups = await groupsFor(user.Username!)
      return {
        username: user.Username,
        id: attr('sub'),
        email: attr('email'),
        firstName: attr('given_name'),
        lastName: attr('family_name'),
        enabled: user.Enabled,
        status: user.UserStatus,
        createdAt: user.UserCreateDate?.toISOString(),
        groups,
        role: roleOf(groups),
      }
    }),
  )
  return { users, nextToken: page.PaginationToken ?? null }
}
