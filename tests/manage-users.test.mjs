import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
const compile = (path) =>
  ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
const permissions = { exports: {} }
vm.runInNewContext(compile('amplify/functions/manage-users/permissions.ts'), permissions)
const { assertRoleChange } = permissions.exports
test('role boundaries prevent self changes and admin access to super admin membership', () => {
  assert.doesNotThrow(() => assertRoleChange('a', 'b', ['admin'], ['user'], 'admin'))
  assert.doesNotThrow(() => assertRoleChange('a', 'b', ['admin'], ['admin'], 'user'))
  assert.doesNotThrow(() => assertRoleChange('a', 'b', ['super_admin'], ['user'], 'super_admin'))
  for (const args of [
    ['a', 'b', ['user'], ['user'], 'admin'],
    ['a', 'a', ['super_admin'], ['super_admin'], 'user'],
    ['a', 'b', ['admin'], ['super_admin'], 'user'],
    ['a', 'b', ['admin'], ['user'], 'super_admin'],
    ['a', 'b', ['super_admin'], ['user'], 'unknown'],
  ])
    assert.throws(() => assertRoleChange(...args))
})
function setup(actorGroups = ['admin']) {
  const calls = []
  const members = { actor: [...actorGroups], target: ['user', 'custom-group'] }
  const SDK = {}
  for (const name of [
    'ListUsersCommand',
    'AdminGetUserCommand',
    'AdminListGroupsForUserCommand',
    'AdminAddUserToGroupCommand',
    'AdminRemoveUserFromGroupCommand',
  ]) {
    SDK[name] = class {
      constructor(input) {
        this.input = input
        this.kind = name
      }
    }
  }
  SDK.CognitoIdentityProviderClient = class {
    async send(command) {
      calls.push(command)
      const { Username, GroupName } = command.input
      if (command.kind === 'AdminListGroupsForUserCommand')
        return { Groups: (members[Username] ?? []).map((GroupName) => ({ GroupName })) }
      if (command.kind === 'AdminGetUserCommand') return { Username }
      if (command.kind === 'AdminAddUserToGroupCommand') {
        members[Username].push(GroupName)
        return {}
      }
      if (command.kind === 'AdminRemoveUserFromGroupCommand') {
        members[Username] = members[Username].filter((g) => g !== GroupName)
        return {}
      }
      if (command.kind === 'ListUsersCommand')
        return {
          Users: [
            {
              Username: 'target',
              Enabled: true,
              UserStatus: 'CONFIRMED',
              Attributes: [{ Name: 'email', Value: 'customer@example.test' }],
            },
          ],
          PaginationToken: 'next-page',
        }
    }
  }
  const context = {
    exports: {},
    require: (name) => (name === './permissions' ? permissions.exports : SDK),
    process: { env: { USER_POOL_ID: 'pool' } },
    console: { info: () => {} },
  }
  vm.runInNewContext(compile('amplify/functions/manage-users/handler.ts'), context)
  return {
    calls,
    members,
    run: (args) => context.exports.handler({ identity: { username: 'actor' }, arguments: args }),
  }
}
test('list uses bounded Cognito pages, search and continuation token', async () => {
  const { run, calls } = setup()
  const result = await run({ emailPrefix: 'customer', nextToken: 'page-2' })
  const list = calls.find((x) => x.kind === 'ListUsersCommand').input
  assert.equal(list.Limit, 20)
  assert.equal(list.Filter, 'email ^= "customer"')
  assert.equal(list.PaginationToken, 'page-2')
  assert.equal(result.nextToken, 'next-page')
  assert.equal(result.users[0].role, 'user')
})
test('changing a role preserves unrelated groups and returns confirmed membership', async () => {
  const { run, members } = setup()
  const result = await run({ username: 'target', role: 'admin' })
  assert.equal(result.role, 'admin')
  assert.deepEqual(members.target, ['custom-group', 'admin'])
})
test('a demoted caller cannot list users even with an old session', async () => {
  const { run, calls } = setup(['user'])
  await assert.rejects(run({}), /NOT_AUTHORIZED/)
  assert.equal(
    calls.some((x) => x.kind === 'ListUsersCommand'),
    false,
  )
})
