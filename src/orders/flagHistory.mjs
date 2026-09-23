export const flagHistory = (order) => {
  let events = []
  try {
    const history = typeof order.history === 'string' ? JSON.parse(order.history) : order.history
    if (Array.isArray(history))
      events = history.filter(
        (event) => event && ['ORDER_FLAGGED', 'ORDER_FLAG_NOTE_UPDATED'].includes(event.type),
      )
  } catch {
    /* Older receipts may not have readable history. */
  }
  if (order.flaggedAt && !events.some((event) => event.type === 'ORDER_FLAGGED')) {
    events = [{ type: 'ORDER_FLAGGED', at: order.flaggedAt, actorId: order.flaggedBy }, ...events]
  }
  return events
}
export const flagActor = (event) => {
  const name = event.actorName || (event.actorId ? 'Account ' + event.actorId : 'Not recorded')
  const role = { admin: 'Admin', super_admin: 'Super admin' }[event.actorRole]
  return role ? name + ' (' + role + ')' : name
}
