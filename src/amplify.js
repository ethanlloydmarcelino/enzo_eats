import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'

Amplify.configure(outputs)

export const passwordPolicy = outputs.auth.password_policy
