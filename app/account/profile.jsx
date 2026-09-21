import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AccountScreen } from '../../src/components/account/AccountScreen'
import { Avatar } from '../../src/components/account/Avatar'
import { fonts } from '../../src/fonts'
import { authErrorKey, profileAttributes, profileError } from '../../src/auth/validation'
import { useAuthStore } from '../../src/store/useAuthStore'
import { useThemeStore } from '../../src/store/useThemeStore'
import { useColors } from '../../src/theme'
import { useTranslations } from '../../src/translations'
import { useOrderStore } from '../../src/store/useOrderStore'
import { saveAccountPreferences } from '../../src/orders/preferences'

const Field = ({ label, hint, colors, ...props }) => (
  <View style={styles.field}>
    <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
    <TextInput
      accessibilityLabel={label}
      placeholderTextColor={colors.mutedForeground}
      maxLength={2048}
      style={[
        styles.input,
        { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
      ]}
      {...props}
    />
    {!!hint && <Text style={[styles.hint, { color: colors.mutedForeground }]}>{hint}</Text>}
  </View>
)

const Profile = () => {
  const { attributes, saveProfile } = useAuthStore()
  const colors = useColors(useThemeStore((state) => state.theme))
  const { t } = useTranslations()
  const [values, setValues] = useState(() => ({
    firstName: attributes?.given_name ?? '',
    lastName: attributes?.family_name ?? '',
    phoneNumber: attributes?.phone_number ?? '',
    address: attributes?.address ?? '',
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const pictureUrl = useOrderStore((state) => state.pictureUrl)
  const [picture, setPicture] = useState(null)

  const change = (key) => (value) => setValues((current) => ({ ...current, [key]: value }))

  const save = async () => {
    const profile = profileAttributes(values)
    const invalid = profileError(profile)
    const photo = (picture ?? pictureUrl).trim()
    try {
      if (photo && (new URL(photo).protocol !== 'https:' || photo.length > 2048)) throw new Error()
    } catch {
      setError('profilePhotoInvalid')
      return
    }
    if (invalid) {
      setError(invalid)
      setNotice('')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await saveProfile(profile)
      await saveAccountPreferences(useAuthStore.getState().user.userId, {
        pictureUrl: photo || null,
      })
      useOrderStore.setState({ pictureUrl: photo })
      setNotice('authProfileSaved')
    } catch (cause) {
      setError(authErrorKey(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AccountScreen title={t('accountManageProfile')} subtitle={t('authProfileDescription')}>
      <View style={styles.avatarRow}>
        <Avatar attributes={attributes} size={76} />
        <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>
          {t('profilePhotoHint')}
        </Text>
      </View>

      <Field
        colors={colors}
        label={t('profilePhotoUrl')}
        hint={t('profilePhotoUrlHint')}
        value={picture ?? pictureUrl}
        onChangeText={setPicture}
        editable={!busy}
        autoCapitalize="none"
        keyboardType="url"
      />
      <Field
        colors={colors}
        label={t('authFirstName')}
        value={values.firstName}
        onChangeText={change('firstName')}
        editable={!busy}
        autoComplete="given-name"
        autoCapitalize="words"
      />
      <Field
        colors={colors}
        label={t('authLastName')}
        value={values.lastName}
        onChangeText={change('lastName')}
        editable={!busy}
        autoComplete="family-name"
        autoCapitalize="words"
      />
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>{t('authEmail')}</Text>
        <Text
          style={[styles.readOnly, { color: colors.mutedForeground, borderColor: colors.border }]}
        >
          {attributes?.email}
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          {t('profileEmailHint')}
        </Text>
      </View>
      <Field
        colors={colors}
        label={t('authPhone')}
        hint={t('authPhoneHint')}
        value={values.phoneNumber}
        onChangeText={change('phoneNumber')}
        editable={!busy}
        autoComplete="tel"
        keyboardType="phone-pad"
        placeholder="+639171234567"
      />
      <Field
        colors={colors}
        label={t('authAddress')}
        value={values.address}
        onChangeText={change('address')}
        editable={!busy}
        autoComplete="street-address"
        multiline
        placeholder={t('authAddressHint')}
      />
      {!!error && (
        <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>
          {t(error)}
        </Text>
      )}
      {!!notice && (
        <Text accessibilityLiveRegion="polite" style={[styles.notice, { color: colors.primary }]}>
          {t(notice)}
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void save()}
        style={[styles.submit, { backgroundColor: colors.primary, opacity: busy ? 0.5 : 1 }]}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>{t('authSaveProfile')}</Text>
        )}
      </Pressable>
    </AccountScreen>
  )
}

const styles = StyleSheet.create({
  avatarRow: { alignItems: 'center', gap: 10, marginBottom: 24 },
  avatarHint: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  field: { gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontFamily: fonts.bold },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 16,
  },
  readOnly: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 48,
    fontSize: 15,
  },
  hint: { fontSize: 12, lineHeight: 18 },
  error: { color: '#c43c3c', fontSize: 14, lineHeight: 21, marginBottom: 8 },
  notice: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  submit: {
    minHeight: 50,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: { color: '#fff', fontFamily: fonts.extraBold, fontSize: 14 },
})

export default Profile
