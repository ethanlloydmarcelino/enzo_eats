import { useEffect, useState } from 'react'
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'
import { useTranslations } from '../translations'

export const LaunchScreen = ({ ready, onFinished }) => {
  const colors = useColors(useThemeStore((state) => state.theme))
  const { t } = useTranslations()
  const [opacity] = useState(() => new Animated.Value(1))
  const [logoOpacity] = useState(() => new Animated.Value(0))
  const [logoScale] = useState(() => new Animated.Value(0.82))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 10,
        stiffness: 130,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start()
  }, [logoOpacity, logoScale])

  useEffect(() => {
    if (!ready) return

    Animated.sequence([
      Animated.delay(250),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onFinished()
    })
  }, [onFinished, opacity, ready])

  return (
    <Animated.View
      accessibilityLabel={t('loadingApp')}
      accessibilityRole="progressbar"
      style={[styles.screen, { backgroundColor: colors.background, opacity }]}
    >
      <Animated.View
        style={[styles.brand, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
      >
        <View style={[styles.mark, { backgroundColor: colors.primary }]}>
          <Text style={styles.markText}>E</Text>
        </View>
        <Text style={[styles.name, { color: colors.ink }]}>Enzo</Text>
        <Text style={[styles.name, { color: colors.primary }]}>Eats</Text>
      </Animated.View>
      <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
      <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
        {t('preparingPickup')}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  markText: { color: '#fff', fontSize: 25, fontWeight: '900' },
  name: { fontSize: 31, fontWeight: '900', letterSpacing: -1.3 },
  spinner: { marginTop: 34 },
  loadingText: { marginTop: 12, fontSize: 13, fontWeight: '600' },
})
