import { Pressable, StyleSheet } from 'react-native'
import Svg, { Circle, ClipPath, Defs, G, Polygon, Rect } from 'react-native-svg'
import { useLanguageStore } from '../store/useLanguageStore'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'
import { useTranslations } from '../translations'

const UnitedStatesFlag = () => (
  <Svg width={25} height={17} viewBox="0 0 30 20" accessibilityElementsHidden>
    <Defs>
      <ClipPath id="usFlagClip">
        <Rect width="30" height="20" rx="2" />
      </ClipPath>
    </Defs>
    <G clipPath="url(#usFlagClip)">
      <Rect width="30" height="20" fill="#fff" />
      {[0, 4, 8, 12, 16].map((y) => (
        <Rect key={y} y={y} width="30" height="2" fill="#d62828" />
      ))}
      <Rect width="13" height="10.8" fill="#25418e" />
      {[2, 6, 10].flatMap((x) =>
        [2, 5.4, 8.8].map((y) => <Circle key={`${x}-${y}`} cx={x} cy={y} r="0.65" fill="#fff" />),
      )}
    </G>
  </Svg>
)

const PhilippinesFlag = () => (
  <Svg width={25} height={17} viewBox="0 0 30 20" accessibilityElementsHidden>
    <Defs>
      <ClipPath id="phFlagClip">
        <Rect width="30" height="20" rx="2" />
      </ClipPath>
    </Defs>
    <G clipPath="url(#phFlagClip)">
      <Rect width="30" height="10" fill="#1f4e9e" />
      <Rect y="10" width="30" height="10" fill="#ce2636" />
      <Polygon points="0,0 15,10 0,20" fill="#fff" />
      <Circle cx="5.3" cy="10" r="2" fill="#f5c518" />
      <Circle cx="2.2" cy="3.2" r="0.8" fill="#f5c518" />
      <Circle cx="2.2" cy="16.8" r="0.8" fill="#f5c518" />
      <Circle cx="11.7" cy="10" r="0.8" fill="#f5c518" />
    </G>
  </Svg>
)

export const LanguageToggle = () => {
  const language = useLanguageStore((state) => state.language)
  const toggleLanguage = useLanguageStore((state) => state.toggleLanguage)
  const colors = useColors(useThemeStore((state) => state.theme))
  const { t } = useTranslations()

  return (
    <Pressable
      onPress={toggleLanguage}
      accessibilityRole="button"
      accessibilityState={{ selected: true }}
      accessibilityHint={t('switchLanguage')}
      accessibilityLabel={language === 'en' ? 'English, U.S. flag' : 'Tagalog, Philippine flag'}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? colors.muted : 'transparent', borderColor: colors.border },
      ]}
    >
      {language === 'en' ? <UnitedStatesFlag /> : <PhilippinesFlag />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
