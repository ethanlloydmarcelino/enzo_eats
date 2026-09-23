import { type ClientSchema, a, defineData } from '@aws-amplify/backend'
import { placeOrder } from '../functions/place-order/resource'
import { reviewOrder } from '../functions/review-order/resource'
import { webPush } from '../functions/web-push/resource'

/**
 * Order holds current state and its durable transition history. OrderEvent is
 * a secondary event feed. Clients never write either one
 * directly — `placeOrder` and `reviewOrder` are the only doors in, so payment
 * rules and approvals cannot be bypassed from a device.
 */
import { manageUsers } from '../functions/manage-users/resource'

const schema = a
  .schema({
    // Retain the existing sandbox table while adding the real order models.
    Todo: a.model({ content: a.string() }).authorization((allow) => [allow.guest()]),
    OrderStatus: a.enum([
      'AWAITING_APPROVAL',
      'APPROVED',
      'DENIED',
      'PREPARING',
      'READY',
      'COMPLETED',
      'CANCELLED',
    ]),

    PaymentMethod: a.enum(['CASH', 'GCASH', 'PAYPAL']),

    OrderLine: a.customType({
      menuId: a.integer().required(),
      name: a.string().required(),
      option: a.string(),
      category: a.string(),
      unitPrice: a.float().required(),
      quantity: a.integer().required(),
      lineTotal: a.float().required(),
    }),

    Order: a
      .model({
        orderNumber: a.string().required(),
        // Cognito sub of the customer. Written by the Lambda from the caller's
        // identity claim, never from the request body.
        owner: a.string().required(),
        status: a.ref('OrderStatus').required(),
        paymentMethod: a.ref('PaymentMethod').required(),
        // GCash reference number, or the PayPal transaction note.
        paymentReference: a.string(),
        paymentVerified: a.boolean().required(),
        requestHash: a.string(),
        history: a.json(),
        // Customer details snapshotted at order time — a later profile edit must
        // not rewrite what the kitchen was told to expect.
        customerFirstName: a.string().required(),
        customerLastName: a.string().required(),
        customerEmail: a.string().required(),
        customerPhone: a.string().required(),
        customerAddress: a.string(),
        lines: a.ref('OrderLine').array().required(),
        subtotal: a.float().required(),
        total: a.float().required(),
        currency: a.string().required(),
        note: a.string(),
        placedAt: a.datetime().required(),
        decidedAt: a.datetime(),
        decidedBy: a.string(),
        decisionNote: a.string(),
        flaggedAt: a.datetime(),
        flaggedBy: a.string(),
        flagReason: a.string(),
        events: a.hasMany('OrderEvent', 'orderId'),
      })
      .secondaryIndexes((index) => [
        index('owner').sortKeys(['placedAt']).queryField('ordersByCustomer'),
        index('status').sortKeys(['placedAt']).queryField('ordersByStatus'),
      ])
      .authorization((allow) => [
        // Customers read their own orders and nothing else; only the Lambdas write.
        allow.ownerDefinedIn('owner').identityClaim('sub').to(['read']),
        allow.groups(['admin', 'super_admin']).to(['read']),
      ]),

    OrderEvent: a
      .model({
        orderId: a.id().required(),
        order: a.belongsTo('Order', 'orderId'),
        // Denormalized so a customer can read their own audit trail without a join.
        owner: a.string().required(),
        type: a.string().required(),
        fromStatus: a.ref('OrderStatus'),
        toStatus: a.ref('OrderStatus'),
        actorId: a.string(),
        actorRole: a.string(),
        message: a.string(),
        occurredAt: a.datetime().required(),
      })
      .authorization((allow) => [
        allow.ownerDefinedIn('owner').identityClaim('sub').to(['read']),
        allow.groups(['admin', 'super_admin']).to(['read']),
      ]),

    placeOrder: a
      .mutation()
      .arguments({
        requestId: a.string().required(),
        paymentMethod: a.ref('PaymentMethod').required(),
        paymentReference: a.string(),
        note: a.string(),
        lines: a.ref('OrderLine').array().required(),
      })
      .returns(a.ref('Order'))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(placeOrder)),

    AccountPreferences: a
      .model({
        owner: a.string().required(),
        favoriteIds: a.integer().array(),
      })
      .authorization((allow) => [allow.ownerDefinedIn('owner').identityClaim('sub')]),

    manageWebPush: a
      .mutation()
      .arguments({ action: a.string().required(), subscription: a.json() })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(webPush)),

    reviewOrder: a
      .mutation()
      .arguments({
        orderId: a.id().required(),
        approve: a.boolean().required(),
        decisionNote: a.string(),
      })
      .returns(a.ref('Order'))
      .authorization((allow) => [allow.groups(['admin', 'super_admin'])])
      .handler(a.handler.function(reviewOrder)),

    listAccountUsers: a
      .query()
      .arguments({ nextToken: a.string(), emailPrefix: a.string() })
      .returns(a.json())
      .authorization((allow) => [allow.groups(['super_admin'])])
      .handler(a.handler.function(manageUsers)),
    changeUserRole: a
      .mutation()
      .arguments({ username: a.string().required(), role: a.string().required() })
      .returns(a.json())
      .authorization((allow) => [allow.groups(['super_admin'])])
      .handler(a.handler.function(manageUsers)),

    flagOrder: a
      .mutation()
      .arguments({ orderId: a.id().required(), flagReason: a.string().required() })
      .returns(a.ref('Order'))
      .authorization((allow) => [allow.groups(['admin', 'super_admin'])])
      .handler(a.handler.function(reviewOrder)),

    advanceOrder: a
      .mutation()
      .arguments({
        orderId: a.id().required(),
        status: a.ref('OrderStatus').required(),
        decisionNote: a.string(),
      })
      .returns(a.ref('Order'))
      .authorization((allow) => [allow.groups(['admin', 'super_admin'])])
      .handler(a.handler.function(reviewOrder)),
  })
  .authorization((allow) => [allow.resource(placeOrder), allow.resource(reviewOrder)])

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
})
