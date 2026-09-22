import { Platform } from 'react-native'
import { useAuthStore } from '../store/useAuthStore'
import { receiptHtml } from './receipts.mjs'
export const printReceipt = (order) => {
  const { status, role } = useAuthStore.getState()
  if (status !== 'signedIn' || !['admin', 'super_admin'].includes(role))
    throw new Error('Admin access is required.')
  if (Platform.OS !== 'web')
    throw new Error('Open Enzo Eats in your browser to print or save a PDF.')
  const html = receiptHtml(order)
  const page = window.open('', '_blank', 'width=850,height=700')
  if (!page) throw new Error('Allow pop-ups for Enzo Eats, then try printing again.')
  page.opener = null
  page.document.write(html)
  page.document.close()
  page.focus()
  page.print()
}
