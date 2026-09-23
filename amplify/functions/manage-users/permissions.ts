export const managedRoles = ['user', 'admin', 'super_admin'] as const
export const roleOf = (groups: string[]) =>
  groups.includes('super_admin') ? 'super_admin' : groups.includes('admin') ? 'admin' : 'user'
export const assertRoleChange = (
  actor: string,
  target: string,
  actorGroups: string[],
  targetGroups: string[],
  next: string,
) => {
  const role = roleOf(actorGroups)
  if (role !== 'super_admin') throw new Error('NOT_AUTHORIZED')
  if (!managedRoles.includes(next as (typeof managedRoles)[number])) throw new Error('INVALID_ROLE')
  if (actor === target) throw new Error('SELF_ROLE_CHANGE')
  if (role !== 'super_admin' && (next === 'super_admin' || targetGroups.includes('super_admin')))
    throw new Error('SUPER_ADMIN_REQUIRED')
}
