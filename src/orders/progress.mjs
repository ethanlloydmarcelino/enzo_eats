export const orderSteps = ['Pending approval', 'Processing', 'Ready for pickup', 'Done']
const index = { AWAITING_APPROVAL: 0, APPROVED: 1, PREPARING: 1, READY: 2, COMPLETED: 3 }
export const orderProgress = (order) => {
  const stopped = ['DENIED', 'CANCELLED'].includes(order.status)
  let stage = index[order.status] ?? 0
  if (stopped) {
    try {
      const history = typeof order.history === 'string' ? JSON.parse(order.history) : order.history
      const previous = Array.isArray(history)
        ? [...history].reverse().find((event) => event && event.status === order.status)?.from
        : undefined
      stage = index[previous] ?? (order.wasCompleted || order.completedAt ? 3 : 0)
    } catch {
      stage = order.wasCompleted || order.completedAt ? 3 : 0
    }
  }
  return { stage, stopped }
}
