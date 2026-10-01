export const orderNotificationAudience = (
  status: string,
  previousStatus?: string,
): 'admin' | 'customer' | null => {
  if (status === previousStatus) return null
  if (status === 'AWAITING_APPROVAL') return 'admin'
  return status === 'READY' ? 'customer' : null
}
