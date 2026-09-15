import { Leaf } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Animated, Platform, StyleSheet, Text, View } from 'react-native'
import { BrandMark } from './BrandMark'
import { fonts } from '../fonts'
import { useThemeStore } from '../store/useThemeStore'
import { useColors } from '../theme'
import { useTranslations } from '../translations'

const useNativeDriver = Platform.OS !== 'web'

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
        useNativeDriver,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 10,
        stiffness: 130,
        mass: 0.8,
        useNativeDriver,
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
        useNativeDriver,
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
        <View style={styles.markWrap}>
          <View style={[styles.mark, { backgroundColor: colors.primary }]}>
            <BrandMark size={26} color="#fff" />
          </View>
          <View style={[styles.leaf, { backgroundColor: colors.coral, borderColor: colors.background }]}>
            <Leaf size={13} color="#fff" strokeWidth={2.75} />
          </View>
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
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  markWrap: { width: 52, height: 52 },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaf: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 31, fontFamily: fonts.black, letterSpacing: -1.3 },
  spinner: { marginTop: 34 },
  loadingText: { marginTop: 12, fontSize: 13, fontFamily: fonts.semiBold },
})
