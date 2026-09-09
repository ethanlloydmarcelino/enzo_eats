import { Headphones, MapPin, Phone } from 'lucide-react-native'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Svg, { Circle, Rect } from 'react-native-svg'
import { Logo } from './Logo'
import { useTranslations } from '../translations'

const InstagramIcon = ({ color = '#777', size = 17 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="5" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
    <Circle cx="18" cy="6" r="1" fill={color} />
  </Svg>
)

export const Footer = () => {
  const { width } = useWindowDimensions()
  const { t } = useTranslations()
  return (
    <View style={styles.footer}>
      <View style={[styles.columns, width >= 720 && styles.columnsWide]}>
        <View style={styles.column}>
          <Logo inverse />
          <Text style={styles.copy}>{t('footerCopy')}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.heading}>{t('ordering')}</Text>
          <Text style={styles.line}>{t('pickupOrdering')}</Text>
          <Text style={styles.line}>{t('availableDaily')}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.heading}>{t('support')}</Text>
          <View style={styles.contactList}>
            <View style={styles.support}>
              <Phone size={17} color="#999" />
              <Text style={styles.supportText}>+63-0927-065-0368</Text>
            </View>
            <View style={styles.support}>
              <MapPin size={17} color="#999" />
              <Text style={styles.supportText}>Quatarman Northern Samar, Philippines</Text>
            </View>
            <View style={styles.support}>
              <Headphones size={17} color="#999" />
              <Text style={styles.supportText}>{t('contactSupport')}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.legal}>© 2026 Enzo Eats</Text>
        <InstagramIcon />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  footer: { backgroundColor: '#111', paddingHorizontal: 18, paddingTop: 52, paddingBottom: 30 },
  columns: { width: '100%', maxWidth: 1204, alignSelf: 'center', gap: 34 },
  columnsWide: { flexDirection: 'row' },
  column: { flex: 1 },
  copy: { color: '#999', fontSize: 14, lineHeight: 22, maxWidth: 300, marginTop: 15 },
  heading: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 12 },
  line: { color: '#999', fontSize: 14, marginTop: 5 },
  contactList: { gap: 10 },
  support: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  supportText: { color: '#999', fontSize: 14, flex: 1 },
  bottom: {
    width: '100%',
    maxWidth: 1204,
    alignSelf: 'center',
    marginTop: 42,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3a3a3a',
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legal: { color: '#777', fontSize: 12 },
})
