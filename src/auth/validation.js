export const profileAttributes = (values) => ({
  given_name: (values.firstName ?? '').trim(),
  family_name: (values.lastName ?? '').trim(),
  phone_number: (values.phoneNumber ?? '').replace(/[\s().-]/g, ''),
  address: (values.address ?? '').trim(),
})

export const profileError = (attributes) => {
  const required = ['given_name', 'family_name', 'phone_number']
  if (required.some((field) => !attributes[field]?.trim() || attributes[field].length > 2048)) {
    return 'authRequiredFields'
  }
  if ((attributes.address?.length ?? 0) > 2048) return 'authAddressTooLong'
  if (!/^\+[1-9]\d{1,14}$/.test(attributes.phone_number)) return 'authInvalidPhone'
  return null
}

export const passwordIsValid = (password, policy) =>
  password.length >= (policy?.min_length ?? 8) &&
  (!policy?.require_lowercase || /[a-z]/.test(password)) &&
  (!policy?.require_uppercase || /[A-Z]/.test(password)) &&
  (!policy?.require_numbers || /\d/.test(password)) &&
  (!policy?.require_symbols || /[^\w\s]|_/.test(password))

export const authErrorKey = (error) => {
  const keys = {
    NotAuthorizedException: 'authInvalidCredentials',
    UserNotFoundException: 'authInvalidCredentials',
    UsernameExistsException: 'authAccountExists',
    CodeMismatchException: 'authInvalidCode',
    ExpiredCodeException: 'authExpiredCode',
    LimitExceededException: 'authTooManyAttempts',
    TooManyRequestsException: 'authTooManyAttempts',
    InvalidPasswordException: 'authPasswordInvalid',
    PasswordHistoryPolicyViolationException: 'authPasswordInvalid',
    NetworkError: 'authNetworkError',
    UserLambdaValidationException: 'authProfileRejected',
  }
  return keys[error?.name] ?? 'authRequestFailed'
}
