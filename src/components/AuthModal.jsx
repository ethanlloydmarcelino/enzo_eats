import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { X } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  confirmResetPassword,
  confirmSignIn,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  signIn,
  signUp,
} from 'aws-amplify/auth'
import { roleLabelKeys } from '../auth/roles'
import { passwordPolicy } from '../amplify'
import { authErrorKey, passwordIsValid, profileAttributes, profileError } from '../auth/validation'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'
import { useTranslations } from '../translations'
import { fonts } from '../fonts'

const emptyValues = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  address: '',
  password: '',
  confirmPassword: '',
  code: '',
}

const Field = ({ label, colors, ...props }) => (
  <View style={styles.field}>
    <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
    <TextInput
      accessibilityLabel={label}
      placeholderTextColor={colors.mutedForeground}
      style={[
        styles.input,
        {
          color: colors.foreground,
          borderColor: colors.border,
          backgroundColor: colors.background,
        },
      ]}
      maxLength={2048}
      {...props}
    />
  </View>
)

const ActionLink = ({ label, onPress, disabled, colors }) => (
  <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={styles.link}>
    <Text style={[styles.linkText, { color: colors.primary, opacity: disabled ? 0.5 : 1 }]}>
      {label}
    </Text>
  </Pressable>
)

const AccountForm = ({ colors, onClose }) => {
  const { t } = useTranslations()
  const {
    user,
    attributes,
    role,
    status,
    sessionError,
    refreshSession,
    saveProfile,
    logOut,
    returnToCart,
  } = useAuthStore()
  const [step, setStep] = useState('signIn')
  const [values, setValues] = useState(() => ({
    ...emptyValues,
    firstName: attributes?.given_name ?? '',
    lastName: attributes?.family_name ?? '',
    email: attributes?.email ?? '',
    phoneNumber: attributes?.phone_number ?? '',
    address: attributes?.address ?? '',
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(0)
  const pending = useRef(false)
  const mounted = useRef(true)
  const signedIn = !!user && !!attributes
  const profileMode = signedIn
  const signupMode = !signedIn && step === 'signUp'
  const passwordMode = !signedIn && ['signIn', 'signUp', 'reset', 'newPassword'].includes(step)
  const newPasswordMode = !signedIn && ['signUp', 'reset', 'newPassword'].includes(step)
  const codeMode = !signedIn && ['confirm', 'reset'].includes(step)
  const email = values.email.trim()
  const disabled = busy || status === 'loading'

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (resendSeconds === 0) return undefined
    const timer = setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => clearTimeout(timer)
  }, [resendSeconds])

  const change = (key) => (value) => setValues((current) => ({ ...current, [key]: value }))
  const go = (next, message = '') => {
    setStep(next)
    setError('')
    setNotice(message)
    setShowPassword(false)
    setValues((current) => ({ ...current, password: '', confirmPassword: '', code: '' }))
  }
  const run = async (action) => {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
    } catch (cause) {
      if (mounted.current) {
        if (cause.name === 'UserNotConfirmedException') go('confirm')
        else setError(authErrorKey(cause))
      }
    } finally {
      pending.current = false
      if (mounted.current) setBusy(false)
    }
  }
  const cooldown = () => setResendSeconds(30)
  const handleSignIn = async (result) => {
    if (result.isSignedIn) {
      setValues(emptyValues)
      await refreshSession()
      return
    }
    switch (result.nextStep.signInStep) {
      case 'CONFIRM_SIGN_UP':
        go('confirm')
        // The original sign-up code may still be valid; let the user request another.
        break
      case 'RESET_PASSWORD':
        await resetPassword({ username: email })
        go('reset')
        cooldown()
        break
      case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
        go('newPassword')
        break
      default:
        setError('authUnsupportedStep')
    }
  }
  const submit = () => {
    const profile = profileAttributes(values)
    if ((profileMode || signupMode) && profileError(profile)) {
      setError(profileError(profile))
      return
    }
    if (!profileMode && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setError('authInvalidEmail')
      return
    }
    if ((passwordMode && !values.password) || (codeMode && !values.code.trim())) {
      setError('authRequiredFields')
      return
    }
    if (newPasswordMode && !passwordIsValid(values.password, passwordPolicy)) {
      setError('authPasswordInvalid')
      return
    }
    if (newPasswordMode && values.password !== values.confirmPassword) {
      setError('authPasswordMismatch')
      return
    }
    void run(async () => {
      if (profileMode) {
        await saveProfile(profile)
        setNotice('authProfileSaved')
      } else if (step === 'signUp') {
        const result = await signUp({
          username: email,
          password: values.password,
          options: {
            userAttributes: Object.fromEntries(
              Object.entries({ ...profile, email }).filter(([, value]) => value !== ''),
            ),
          },
        })
        if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
          go('confirm')
          cooldown()
        } else if (result.isSignUpComplete) {
          go('signIn', 'authVerified')
        } else {
          setError('authUnsupportedStep')
        }
      } else if (step === 'confirm') {
        const result = await confirmSignUp({
          username: email,
          confirmationCode: values.code.trim(),
        })
        if (result.isSignUpComplete) go('signIn', 'authVerified')
        else setError('authUnsupportedStep')
      } else if (step === 'signIn') {
        await handleSignIn(await signIn({ username: email, password: values.password }))
      } else if (step === 'forgot') {
        const result = await resetPassword({ username: email })
        if (result.nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
          go('reset')
          cooldown()
        } else go('signIn')
      } else if (step === 'reset') {
        await confirmResetPassword({
          username: email,
          confirmationCode: values.code.trim(),
          newPassword: values.password,
        })
        go('signIn', 'authPasswordReset')
      } else if (step === 'newPassword') {
        await handleSignIn(await confirmSignIn({ challengeResponse: values.password }))
      }
    })
  }
  const resend = () =>
    run(async () => {
      if (step === 'confirm') await resendSignUpCode({ username: email })
      else await resetPassword({ username: email })
      setNotice('authCodeSent')
      cooldown()
    })
  const title = profileMode
    ? 'authProfile'
    : {
        signIn: 'authWelcome',
        signUp: 'authSignUp',
        confirm: 'authVerify',
        forgot: 'authReset',
        reset: 'authReset',
        newPassword: 'authNewPassword',
      }[step]
  const button = profileMode
    ? 'authSaveProfile'
    : {
        signIn: 'authSignIn',
        signUp: 'authSignUp',
        confirm: 'authConfirm',
        forgot: 'authSendReset',
        reset: 'authSavePassword',
        newPassword: 'authSavePassword',
      }[step]
  const description = profileMode
    ? returnToCart
      ? 'authCompleteProfile'
      : 'authProfileDescription'
    : signupMode
      ? 'authJoin'
      : codeMode
        ? 'authVerifyDescription'
        : step === 'forgot'
          ? 'authResetDescription'
          : 'authSignInDescription'
  const field = (key, label, props = {}) => (
    <Field
      key={key}
      colors={colors}
      label={t(label)}
      value={values[key]}
      onChangeText={change(key)}
      editable={!disabled}
      {...props}
    />
  )

  return (
    <>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>
          {t(title)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('authClose')}
          onPress={onClose}
          style={styles.close}
        >
          <X size={22} color={colors.foreground} />
        </Pressable>
      </View>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        {t(description, { email })}
      </Text>
      {status === 'loading' && (
        <ActivityIndicator accessibilityLabel={t('authLoading')} color={colors.primary} />
      )}
      {sessionError ? (
        <View>
          <Text accessibilityRole="alert" style={styles.error}>
            {t('authSessionError')}
          </Text>
          {
            <ActionLink
              label={t('authRetry')}
              colors={colors}
              disabled={disabled}
              onPress={() => void refreshSession()}
            />
          }
        </View>
      ) : (
        <>
          {profileMode && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>{t('authRole')}</Text>
              <Text style={{ color: colors.mutedForeground }}>
                {t(roleLabelKeys[role] ?? 'authRoleUser')}
              </Text>
            </View>
          )}
          {(signupMode || profileMode) && (
            <>
              {field('firstName', 'authFirstName', {
                autoComplete: 'given-name',
                autoCapitalize: 'words',
              })}
              {field('lastName', 'authLastName', {
                autoComplete: 'family-name',
                autoCapitalize: 'words',
              })}
            </>
          )}
          {!codeMode &&
            step !== 'newPassword' &&
            field('email', 'authEmail', {
              autoComplete: 'email',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
              autoCorrect: false,
              editable: !profileMode && !disabled,
            })}
          {(signupMode || profileMode) && (
            <>
              {field('phoneNumber', 'authPhone', {
                autoComplete: 'tel',
                keyboardType: 'phone-pad',
                placeholder: '+639171234567',
              })}
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                {t('authPhoneHint')}
              </Text>
              {field('address', 'authAddress', {
                autoComplete: 'street-address',
                multiline: true,
                placeholder: t('authAddressHint'),
              })}
            </>
          )}
          {codeMode &&
            field('code', 'authCode', {
              autoComplete: 'one-time-code',
              keyboardType: 'number-pad',
              autoCapitalize: 'none',
              maxLength: 12,
            })}
          {passwordMode &&
            field(
              'password',
              newPasswordMode ? (signupMode ? 'authPassword' : 'authNewPassword') : 'authPassword',
              {
                secureTextEntry: !showPassword,
                autoComplete: newPasswordMode ? 'new-password' : 'current-password',
                autoCapitalize: 'none',
                autoCorrect: false,
                maxLength: 256,
              },
            )}
          {newPasswordMode && (
            <>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                {t('authPasswordHint', { length: passwordPolicy?.min_length ?? 8 })}
              </Text>
              {field('confirmPassword', 'authConfirmPassword', {
                secureTextEntry: !showPassword,
                autoComplete: 'new-password',
                autoCapitalize: 'none',
                autoCorrect: false,
                maxLength: 256,
              })}
            </>
          )}
          {passwordMode && (
            <ActionLink
              label={t(showPassword ? 'authHidePassword' : 'authShowPassword')}
              colors={colors}
              disabled={disabled}
              onPress={() => setShowPassword(!showPassword)}
            />
          )}
          {!!error && (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
              style={styles.error}
            >
              {t(error)}
            </Text>
          )}
          {!!notice && (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.notice, { color: colors.primary }]}
            >
              {t(notice)}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={submit}
            style={[
              styles.submit,
              { backgroundColor: colors.primary, opacity: disabled ? 0.5 : 1 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{t(button)}</Text>
            )}
          </Pressable>
          {profileMode ? (
            <ActionLink
              label={t('authSignOut')}
              colors={colors}
              disabled={disabled}
              onPress={() =>
                void run(async () => {
                  await logOut()
                })
              }
            />
          ) : (
            <>
              {step === 'signIn' && (
                <ActionLink
                  label={t('authForgot')}
                  colors={colors}
                  disabled={disabled}
                  onPress={() => go('forgot')}
                />
              )}
              {step === 'signIn' && (
                <ActionLink
                  label={t('authNeedAccount')}
                  colors={colors}
                  disabled={disabled}
                  onPress={() => go('signUp')}
                />
              )}
              {step === 'signUp' && (
                <ActionLink
                  label={t('authHaveAccount')}
                  colors={colors}
                  disabled={disabled}
                  onPress={() => go('signIn')}
                />
              )}
              {codeMode && (
                <ActionLink
                  label={t('authResend')}
                  colors={colors}
                  disabled={disabled || resendSeconds > 0}
                  onPress={() => void resend()}
                />
              )}
              {!['signIn', 'signUp'].includes(step) && (
                <ActionLink
                  label={t('authBack')}
                  colors={colors}
                  disabled={disabled}
                  onPress={() => go('signIn')}
                />
              )}
            </>
          )}
        </>
      )}
    </>
  )
}

export const AuthModal = () => {
  const { accountOpen, closeAccount, status, attributes, user, returnToCart } = useAuthStore()
  const colors = useColors(useThemeStore((state) => state.theme))
  const insets = useSafeAreaInsets()

  useEffect(() => {
    const complete =
      attributes &&
      !profileError({
        given_name: attributes.given_name ?? '',
        family_name: attributes.family_name ?? '',
        phone_number: attributes.phone_number ?? '',
        address: attributes.address ?? '',
      })
    if (accountOpen && returnToCart && status === 'signedIn' && complete) closeAccount()
  }, [accountOpen, returnToCart, status, attributes, closeAccount])

  return (
    <Modal visible={accountOpen} transparent animationType="fade" onRequestClose={closeAccount}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[
          styles.overlay,
          {
            backgroundColor: colors.overlay,
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.card }]}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {accountOpen && (
              <AccountForm key={user?.userId ?? 'guest'} colors={colors} onClose={closeAccount} />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  sheet: { width: '100%', maxWidth: 480, maxHeight: '100%', borderRadius: 22, overflow: 'hidden' },
  content: { padding: 24 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1, fontSize: 26, fontFamily: fonts.black, letterSpacing: -0.7 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  description: { fontSize: 14, lineHeight: 21, marginBottom: 20 },
  field: { gap: 6, marginBottom: 14 },
  label: { fontSize: 13, fontFamily: fonts.bold },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 16,
  },
  hint: { fontSize: 12, lineHeight: 18, marginTop: -6, marginBottom: 14 },
  submit: {
    minHeight: 50,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: { color: '#fff', fontFamily: fonts.extraBold, fontSize: 14 },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  linkText: { fontFamily: fonts.bold, fontSize: 13, textAlign: 'center' },
  error: { color: '#c43c3c', fontSize: 14, lineHeight: 21, marginVertical: 10 },
  notice: { fontSize: 14, lineHeight: 21, marginVertical: 10 },
})
