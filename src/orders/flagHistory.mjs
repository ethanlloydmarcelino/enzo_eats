export const flagHistory = (order, actorNames = {}) => {
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
  return events.map((event) => ({
    ...event,
    actorName: event.actorName || actorNames[event.actorId],
  }))
}
export const flagActor = (event) => {
  const name = event.actorName || 'Name unavailable'
  const role = { admin: 'Admin', super_admin: 'Super admin', customer: 'Customer', user: 'User' }[
    event.actorRole
  ]
  return role ? name + ' (' + role + ')' : name
}
