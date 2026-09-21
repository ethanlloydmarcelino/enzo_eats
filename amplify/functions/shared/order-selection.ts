// Include every field used by model subscriptions in the mutation response.
export const orderSelection = `id orderNumber owner status paymentMethod paymentReference paymentVerified
  customerFirstName customerLastName customerEmail customerPhone customerAddress
  lines { menuId name option category unitPrice quantity lineTotal }
  subtotal total currency note placedAt decidedAt decidedBy decisionNote createdAt updatedAt requestHash history`
