import { CountryFlag } from './CountryFlag'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { phoneCountries } from '../auth/phone.mjs'
import { useTranslations } from '../translations'

export const PhoneField = ({
  country = 'PH',
  value,
  onCountryChange,
  onChangeText,
  disabled,
  colors,
}) => {
  const [open, setOpen] = useState(false)
  const { t } = useTranslations()
  const selected = phoneCountries.find((item) => item.id === country) || phoneCountries[0]
  const box = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 48,
    backgroundColor: colors.background,
  }
  const text = { color: colors.foreground, fontSize: 15 }
  return (
    <View style={{ gap: 6, marginBottom: 16 }}>
      <Text style={[text, { fontWeight: 'bold' }]}>{t('authPhone')}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('authPhoneCountry') + ': ' + selected.name}
        accessibilityState={{ expanded: open, disabled: !!disabled }}
        disabled={disabled}
        onPress={() => setOpen(!open)}
        style={box}
      >
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <CountryFlag country={selected.id} />
          <Text style={text}>
            {selected.name} (+{selected.code}) {open ? '\u25B4' : '\u25BE'}
          </Text>
        </View>
      </Pressable>
      {open && (
        <View style={box}>
          {phoneCountries.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: item.id === country }}
              disabled={disabled}
              onPress={() => {
                onCountryChange(item.id)
                setOpen(false)
              }}
              style={{ paddingVertical: 12 }}
            >
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <CountryFlag country={item.id} />
                <Text style={text}>
                  {item.name} (+{item.code}){item.id === country ? ' \u2713' : ''}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      <TextInput
        accessibilityLabel={t('authPhone')}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        autoComplete="tel-national"
        keyboardType="phone-pad"
        autoCorrect={false}
        maxLength={30}
        placeholder={selected.example}
        placeholderTextColor={colors.mutedForeground}
        style={[box, text]}
      />
      <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>
        {t('authPhoneHint')}
      </Text>
    </View>
  )
}
