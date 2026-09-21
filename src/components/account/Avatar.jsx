import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { photoSource } from '../../storage/photos'
import { Image, StyleSheet, Text, View } from 'react-native'
import { fonts } from '../../fonts'
import { useThemeStore } from '../../store/useThemeStore'
import { useColors } from '../../theme'
import { useOrderStore } from '../../store/useOrderStore'

const initialsOf = (first, last) =>
  `${(first ?? '').trim().charAt(0)}${(last ?? '').trim().charAt(0)}`.toUpperCase()

/**
 * The customer's initials on the brand green. A `picture` URL is rendered when
 * one is saved in the customer's private account preferences.
 */
export const Avatar = ({ attributes, size = 64 }) => {
  const colors = useColors(useThemeStore((state) => state.theme))
  const [failed, setFailed] = useState(null)
  const pictureUrl = useOrderStore((state) => state.pictureUrl)
  const pictureKey = useOrderStore((state) => state.pictureKey)
  const { data: source } = useQuery({
    queryKey: ['profile-photo', pictureKey],
    queryFn: () => photoSource(pictureKey),
    enabled: !!pictureKey,
    staleTime: 45 * 60 * 1000,
    refetchInterval: 45 * 60 * 1000,
  })
  const picture = pictureKey ? source?.uri : pictureUrl
  const initials = initialsOf(attributes?.given_name, attributes?.family_name)

  if (picture && failed !== picture) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: picture }}
        onError={() => setFailed(picture)}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    )
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials || '·'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: { resizeMode: 'cover' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontFamily: fonts.black, letterSpacing: 0.5 },
})
