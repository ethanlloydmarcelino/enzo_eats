import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { placeOrder } from './functions/place-order/resource'
import { reviewOrder } from './functions/review-order/resource'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Stack, Duration } from 'aws-cdk-lib'
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { CfnFunction, EventSourceMapping, StartingPosition } from 'aws-cdk-lib/aws-lambda'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { SqsDlq } from 'aws-cdk-lib/aws-lambda-event-sources'
import { storage } from './storage/resource'
import { webPush } from './functions/web-push/resource'

const backend = defineBackend({
  auth,
  data,
  placeOrder,
  reviewOrder,
  storage,
  webPush,
})

// This sandbox already has its required standard attributes. Cognito's update
// handler attempts to add them again when Schema is sent during an update.
// Omit that immutable declaration while preserving the existing pool and users.
backend.auth.resources.cfnResources.cfnUserPool.addPropertyDeletionOverride('Schema')

backend.placeOrder.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId)
backend.placeOrder.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['cognito-idp:AdminGetUser'],
    resources: [backend.auth.resources.userPool.userPoolArn],
  }),
)

const pushLambda = backend.webPush.resources.lambda
const pushStack = Stack.of(pushLambda)
const subscriptions = new Table(pushStack, 'PushSubscriptions', {
  partitionKey: { name: 'owner', type: AttributeType.STRING },
  sortKey: { name: 'device', type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: 'expiresAt',
})
const vapid = new Secret(pushStack, 'WebPushKeys', {
  generateSecretString: { secretStringTemplate: '{}', generateStringKey: 'seed' },
})
subscriptions.grantReadWriteData(pushLambda)
vapid.grantRead(pushLambda)
vapid.grantWrite(pushLambda)
backend.webPush.addEnvironment('SUBSCRIPTIONS_TABLE', subscriptions.tableName)
backend.webPush.addEnvironment('VAPID_SECRET', vapid.secretArn)
backend.webPush.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId)
pushLambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['cognito-idp:ListUsersInGroup'],
    resources: [backend.auth.resources.userPool.userPoolArn],
  }),
)
;(pushLambda.node.defaultChild as CfnFunction).reservedConcurrentExecutions = 1
const orders = backend.data.resources.tables.Order
orders.grantStreamRead(pushLambda)
const failedPush = new Queue(pushStack, 'FailedPushEvents', { retentionPeriod: Duration.days(14) })
new EventSourceMapping(pushStack, 'OrderPushStream', {
  target: pushLambda,
  eventSourceArn: orders.tableStreamArn,
  startingPosition: StartingPosition.LATEST,
  batchSize: 1,
  retryAttempts: 3,
  maxRecordAge: Duration.hours(1),
  onFailure: new SqsDlq(failedPush),
})
