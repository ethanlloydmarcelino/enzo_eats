import { orderHistory, orderAction } from './orderHistory.mjs'
import { flagActor } from './flagHistory.mjs'

export const completedAt = (order) => {
  try {
    const history = typeof order.history === 'string' ? JSON.parse(order.history) : order.history
    return Array.isArray(history)
      ? ([...history]
          .reverse()
          .find(
            (event) =>
              event.status === 'COMPLETED' &&
              !['ORDER_FLAGGED', 'ORDER_FLAG_NOTE_UPDATED'].includes(event.type),
          )?.at ?? null)
      : null
  } catch {
    return null
  }
}
export const receiptDate = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Not recorded'
  return (
    new Intl.DateTimeFormat('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Manila',
    }).format(new Date(value)) + ' (Philippine time)'
  )
}
export const receiptMoney = (value, currency = 'PHP') =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency }).format(value)
const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  )
export const receiptHtml = (order, actorNames = {}) => {
  if (order.status !== 'COMPLETED')
    throw new Error('Only completed orders have accounting receipts.')
  const money = (value) => escape(receiptMoney(value, order.currency))
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Receipt ${escape(order.orderNumber)}</title><style>
  body{font:14px Arial,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:16px}h1{margin-bottom:4px}p{overflow-wrap:anywhere;line-height:1.5}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{padding:10px 6px;border-bottom:1px solid #ddd;text-align:right}th:first-child,td:first-child{text-align:left;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}.totals{text-align:right}.note{white-space:pre-wrap}@page{margin:16mm}@media print{body{margin:0;padding:0}}
  </style></head><body><h1>Enzo Eats</h1><p>Itemized order receipt - accounting copy</p>
  <h2>${escape(order.orderNumber)}</h2>
  <p>Order ID: ${escape(order.id)}<br>Status: Completed<br>Ordered: ${escape(receiptDate(order.placedAt))}<br>Completed: ${escape(receiptDate(completedAt(order)))}</p>
  ${order.flaggedAt ? '<p class="note"><strong>Flagged for review</strong><br>' + escape(order.flagReason) + '<br>Flagged: ' + escape(receiptDate(order.flaggedAt)) + '</p>' : ''}
  <h3>Customer</h3><p>${escape(order.customerFirstName)} ${escape(order.customerLastName)}<br>${escape(order.customerEmail)}<br>${escape(order.customerPhone)}${order.customerAddress ? '<br>' + escape(order.customerAddress) : ''}</p>
  <table><thead><tr><th>Item / option</th><th>Quantity</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>
  ${(order.lines ?? []).map((line) => `<tr><td>${escape(line.name)}${line.option ? ' - ' + escape(line.option) : ''}</td><td>${escape(line.quantity)}</td><td>${money(line.unitPrice)}</td><td>${money(line.lineTotal)}</td></tr>`).join('')}
  </tbody></table><div class="totals"><p>Subtotal: ${money(order.subtotal)}</p><h2>Total: ${money(order.total)}</h2></div>
  <p>Payment: ${escape(order.paymentMethod)}<br>Payment verified: ${order.paymentVerified ? 'Yes' : 'No'}${order.paymentReference ? '<br>Reference: ' + escape(order.paymentReference) : ''}</p>
  ${order.note ? '<p class="note">Customer note: ' + escape(order.note) + '</p>' : ''}
  ${order.decisionNote ? '<p class="note">Admin note: ' + escape(order.decisionNote) + '</p>' : ''}
  ${
    '<h3>Order activity</h3>' +
    orderHistory(order, actorNames)
      .map(
        (event) =>
          '<div class="note"><p><strong>' +
          escape(orderAction(event)) +
          '</strong><br>' +
          escape(flagActor(event)) +
          '<br>' +
          escape(receiptDate(event.at)) +
          (event.previousNote !== undefined
            ? '<br>Previous note: ' + escape(event.previousNote)
            : '') +
          '<br>Note: ' +
          escape(event.note ?? 'Not recorded') +
          '</p></div>',
      )
      .join('')
  }
  </body></html>`
}
