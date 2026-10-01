// Shared by Cognito and the signup/reset form to prevent policy drift.
export const passwordPolicy = {
  min_length: 8,
  require_lowercase: false,
  require_uppercase: false,
  require_numbers: false,
  require_symbols: false,
}
export const cognitoPasswordPolicy = {
  minimumLength: passwordPolicy.min_length,
  requireLowercase: passwordPolicy.require_lowercase,
  requireUppercase: passwordPolicy.require_uppercase,
  requireNumbers: passwordPolicy.require_numbers,
  requireSymbols: passwordPolicy.require_symbols,
  temporaryPasswordValidityDays: 3,
}
