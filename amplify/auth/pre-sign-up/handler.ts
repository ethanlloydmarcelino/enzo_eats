import type { PreSignUpTriggerHandler } from 'aws-lambda'

export const handler: PreSignUpTriggerHandler = async (event) => {
  const attributes = event.request.userAttributes
  for (const field of ['given_name', 'family_name', 'email', 'phone_number']) {
    const value = attributes[field]
    if (!value?.trim() || value.length > 2048) {
      throw new Error('First name, last name, email, and phone number are required.')
    }
  }
  if (!/^\+[1-9]\d{1,14}$/.test(attributes.phone_number)) {
    throw new Error('Enter a phone number with a country code, such as +639171234567.')
  }
  if ((attributes.address?.length ?? 0) > 2048) {
    throw new Error('Address must be 2,048 characters or fewer.')
  }
  // Keep Cognito's email confirmation flow; never auto-confirm or auto-verify.
  return event
}
