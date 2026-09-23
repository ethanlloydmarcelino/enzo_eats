export const receiptSearch = (criteria = {}) => {
  const { from = '', to = '', term = '', payment = '', flagged = '' } = criteria
  for (const value of [from, to]) {
    if (
      value &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(Date.parse(value)) ||
        new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value)
    )
      throw new Error('Use valid dates in YYYY-MM-DD format.')
  }
  if (from && to && from > to) throw new Error('The start date must be before the end date.')
  const start = from ? new Date(from + 'T00:00:00+08:00').toISOString() : undefined
  const end = to ? new Date(to + 'T23:59:59.999+08:00').toISOString() : undefined
  const and = []
  const words = term.trim().split(/\s+/).filter(Boolean)
  if (words.length > 8) throw new Error('Please use up to 8 search words.')
  for (const word of words)
    and.push({
      or: [
        'orderNumber',
        'customerEmail',
        'customerFirstName',
        'customerLastName',
        'paymentReference',
      ].map((field) => ({ [field]: { contains: word } })),
    })
  if (payment) and.push({ paymentMethod: { eq: payment } })
  if (flagged === 'flagged') and.push({ flaggedAt: { gt: '' } })
  if (flagged === 'unflagged')
    and.push({ or: [{ flaggedAt: { attributeExists: false } }, { flaggedAt: { eq: null } }] })
  return {
    key: {
      status: 'COMPLETED',
      ...(start && end
        ? { placedAt: { between: [start, end] } }
        : start
          ? { placedAt: { ge: start } }
          : end
            ? { placedAt: { le: end } }
            : {}),
    },
    filter: and.length ? { and } : undefined,
  }
}
