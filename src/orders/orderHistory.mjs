export const orderHistory = (order, actorNames = {}) => {
  let events = []
  try {
    const parsed = typeof order.history === 'string' ? JSON.parse(order.history) : order.history
    if (Array.isArray(parsed)) events = parsed.filter((event) => event && typeof event === 'object')
  } catch {
    /* Older orders may lack history. */
  }
  if (order.flaggedAt && !events.some((event) => event.type === 'ORDER_FLAGGED'))
    events = [...events, { type: 'ORDER_FLAGGED', at: order.flaggedAt, actorId: order.flaggedBy }]
  return events.map((event) => ({
    ...event,
    actorName:
      event.actorName ||
      (event.type === 'ORDER_PLACED' && event.actorId === order.owner
        ? [order.customerFirstName, order.customerLastName].filter(Boolean).join(' ')
        : '') ||
      actorNames[event.actorId],
    actorRole: event.actorRole || (event.type === 'ORDER_PLACED' ? 'customer' : undefined),
  }))
}
export const orderAction = (event) =>
  ({
    ORDER_PLACED: 'Order placed',
    ORDER_APPROVED: 'Order approved',
    ORDER_DENIED: 'Order denied',
    ORDER_PREPARING: 'Preparation started',
    ORDER_READY: 'Marked ready',
    ORDER_COMPLETED: 'Order completed',
    ORDER_CANCELLED: 'Order cancelled',
    ORDER_FLAGGED: 'Order flagged',
    ORDER_FLAG_NOTE_UPDATED: 'Flag note edited',
  })[event.type || 'ORDER_' + event.status] || 'Order updated'
