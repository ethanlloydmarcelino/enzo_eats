import { Platform } from 'react-native'
import { useAuthStore } from '../store/useAuthStore'
import { receiptHtml } from './receipts.mjs'
import { resolveFlagActors } from './resolveFlagActors'
export const printReceipt = async (order) => {
  const { status, role, user } = useAuthStore.getState()
  if (status !== 'signedIn' || !['admin', 'super_admin'].includes(role))
    throw new Error('Admin access is required.')
  if (Platform.OS !== 'web')
    throw new Error('Open Enzo Eats in your browser to print or save a PDF.')
  receiptHtml(order)
  const page = window.open('', '_blank', 'width=850,height=700')
  if (!page) throw new Error('Allow pop-ups for Enzo Eats, then try printing again.')
  page.opener = null
  try {
    page.document.write('<p>Loading receipt...</p>')
    const names = await resolveFlagActors(order)
    const current = useAuthStore.getState()
    if (
      current.status !== 'signedIn' ||
      current.user?.userId !== user?.userId ||
      !['admin', 'super_admin'].includes(current.role)
    )
      throw new Error('Admin access is required.')
    if (page.closed) return
    page.document.open()
    page.document.write(receiptHtml(order, names))
    page.document.close()
    page.focus()
    page.print()
  } catch (error) {
    page.close()
    throw error
  }
}
