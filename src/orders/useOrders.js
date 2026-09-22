import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { cartToLines, dataClient, throwOnErrors, listAll } from './client'
import { useAuthStore } from '../store/useAuthStore'

const ADMIN_ROLES = ['admin', 'super_admin']

export const AWAITING = 'AWAITING_APPROVAL'
export const OPEN_STATUSES = [AWAITING, 'APPROVED', 'PREPARING', 'READY']
export const isPastOrder = (order) => ['COMPLETED', 'DENIED', 'CANCELLED'].includes(order.status)

const byNewest = (a, b) => (a.placedAt < b.placedAt ? 1 : -1)

/**
 * Subscribe to order creates and updates, tolerating a backend that has not been
 * deployed yet — `amplify_outputs.json` can still describe an older schema, and a
 * missing model must degrade to "no live updates", never crash the screen.
 */
const subscribeToOrders = (onChange) => {
  const model = dataClient.models?.Order
  if (!model?.onCreate) return () => {}
  const subscriptions = [
    model.onCreate().subscribe({ next: onChange, error: () => {} }),
    model.onUpdate().subscribe({ next: onChange, error: () => {} }),
  ]
  return () => subscriptions.forEach((subscription) => subscription.unsubscribe())
}

/** The customer's own orders. Owner-based auth scopes the list server-side. */
export const useMyOrders = () => {
  const userId = useAuthStore((state) => state.user?.userId)
  const status = useAuthStore((state) => state.status)
  const queryClient = useQueryClient()
  const enabled = status === 'signedIn' && !!userId

  const query = useQuery({
    queryKey: ['orders', 'mine', userId],
    enabled,
    refetchInterval: 30000,
    queryFn: async () => {
      const orders = await listAll((nextToken) =>
        dataClient.models.Order.ordersByCustomer({ owner: userId }, { nextToken }),
      )
      return [...orders].sort(byNewest)
    },
  })

  // Live updates: the customer sees an admin's approval or denial without
  // refreshing, which is the whole point of the event-driven flow.
  useEffect(() => {
    if (!enabled) return undefined
    return subscribeToOrders(() => queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] }))
  }, [enabled, queryClient, userId])

  return query
}

/** Every order awaiting a decision, for the admin console. */
export const useOrdersAwaitingReview = (operational = false) => {
  const userId = useAuthStore((state) => state.user?.userId)
  const role = useAuthStore((state) => state.role)
  const status = useAuthStore((state) => state.status)
  const queryClient = useQueryClient()
  const enabled = status === 'signedIn' && ADMIN_ROLES.includes(role)

  const query = useQuery({
    queryKey: ['orders', 'review', userId, role, operational],
    enabled,
    refetchInterval: 30000,
    queryFn: async () => {
      const statuses = operational ? ['APPROVED', 'PREPARING', 'READY'] : [AWAITING]
      const orders = (
        await Promise.all(
          statuses.map((status) =>
            listAll((nextToken) =>
              dataClient.models.Order.ordersByStatus({ status }, { nextToken }),
            ),
          ),
        )
      ).flat()
      return [...orders].sort(byNewest)
    },
  })

  useEffect(() => {
    if (!enabled) return undefined
    return subscribeToOrders(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))
  }, [enabled, queryClient, userId, role])

  return query
}

/** Count of orders needing a decision, for the badge on the admin entry point. */
export const useReviewCount = () => useOrdersAwaitingReview().data?.length ?? 0

export const usePlaceOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cart, language, paymentMethod, paymentReference, note, requestId }) =>
      throwOnErrors(
        await dataClient.mutations.placeOrder({
          requestId,
          paymentMethod,
          paymentReference: paymentReference || null,
          note: note || null,
          lines: cartToLines(cart, language),
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export const useReviewOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, approve, decisionNote, status }) =>
      status
        ? throwOnErrors(await dataClient.mutations.advanceOrder({ orderId, status }))
        : throwOnErrors(
            await dataClient.mutations.reviewOrder({
              orderId,
              approve,
              decisionNote: decisionNote || null,
            }),
          ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })
}

/** Completed order snapshots, paginated for the accounting archive. */
export const useCompletedOrders = () => {
  const { user, role, status } = useAuthStore()
  const queryClient = useQueryClient()
  const enabled = status === 'signedIn' && ADMIN_ROLES.includes(role)
  const query = useInfiniteQuery({
    queryKey: ['orders', 'receipts', user?.userId, role],
    enabled,
    initialPageParam: undefined,
    getNextPageParam: (page) => page.nextToken || undefined,
    refetchInterval: 30000,
    queryFn: async ({ pageParam }) => {
      const page = await dataClient.models.Order.ordersByStatus(
        { status: 'COMPLETED' },
        { nextToken: pageParam, limit: 25, sortDirection: 'DESC' },
      )
      throwOnErrors(page)
      return page
    },
  })
  useEffect(() => {
    if (!enabled) return undefined
    return subscribeToOrders(() =>
      queryClient.invalidateQueries({ queryKey: ['orders', 'receipts'] }),
    )
  }, [enabled, queryClient, user?.userId, role])
  return query
}
