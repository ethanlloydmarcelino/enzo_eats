import { dataClient, throwOnErrors } from './client'
import { orderHistory } from './orderHistory.mjs'

export const resolveFlagActors = async (order) => {
  const ids = [
    ...new Set(
      orderHistory(order)
        .filter((event) => !event.actorName && event.actorId)
        .map((event) => event.actorId),
    ),
  ]
  const names = {}
  for (let start = 0; start < ids.length; start += 20) {
    const result = throwOnErrors(
      await dataClient.queries.resolveFlagActors({
        orderId: order.id,
        actorIds: ids.slice(start, start + 20),
      }),
    )
    const data = typeof result === 'string' ? JSON.parse(result) : result
    for (const actor of data?.actors ?? []) names[actor.id] = actor.name
  }
  return names
}
