// Only Cognito group claims determine roles; editable profile attributes do not.
export const roleFromGroups = (groups) => {
  if (!Array.isArray(groups)) return 'user'
  if (groups.includes('super_admin')) return 'super_admin'
  if (groups.includes('admin')) return 'admin'
  return 'user'
}

export const roleLabelKeys = {
  super_admin: 'authRoleSuperAdmin',
  admin: 'authRoleAdmin',
  user: 'authRoleUser',
}
