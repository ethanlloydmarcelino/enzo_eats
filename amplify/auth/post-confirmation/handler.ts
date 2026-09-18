import type { PostConfirmationTriggerHandler } from 'aws-lambda'
import {
  AdminAddUserToGroupCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient({})

export const handler: PostConfirmationTriggerHandler = async (event) => {
  // Password resets also invoke this trigger. They must not change group membership.
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') return event

  // The role is chosen by the backend, never from attributes or client metadata.
  await client.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: event.userPoolId,
      Username: event.userName,
      GroupName: 'user',
    }),
  )
  return event
}
