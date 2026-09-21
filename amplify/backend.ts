import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { placeOrder } from './functions/place-order/resource'
import { reviewOrder } from './functions/review-order/resource'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'

const backend = defineBackend({
  auth,
  data,
  placeOrder,
  reviewOrder,
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
