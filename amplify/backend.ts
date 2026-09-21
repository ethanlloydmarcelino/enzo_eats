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

backend.placeOrder.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId)
backend.placeOrder.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['cognito-idp:AdminGetUser'],
    resources: [backend.auth.resources.userPool.userPoolArn],
  }),
)
