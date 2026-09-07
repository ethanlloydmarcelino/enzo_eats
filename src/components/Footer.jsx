import { Headphones } from 'lucide-react-native'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Svg, { Circle, Rect } from 'react-native-svg'
import { Logo } from './Logo'

const InstagramIcon = ({ color = '#777', size = 17 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="5" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
    <Circle cx="18" cy="6" r="1" fill={color} />
  </Svg>
)

export const Footer = () => {
  const { width } = useWindowDimensions()
  return (
    <View style={styles.footer}>
      <View style={[styles.columns, width >= 720 && styles.columnsWide]}>
        <View style={styles.column}>
          <Logo inverse />
          <Text style={styles.copy}>Simple online ordering for your favorite rice meals.</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.heading}>Ordering</Text>
          <Text style={styles.line}>Pickup or delivery</Text>
          <Text style={styles.line}>Available every day</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.heading}>Support</Text>
          <View style={styles.support}>
            <Headphones size={17} color="#999" />
            <Text style={styles.supportText}>Contact Enzo Eats about your order</Text>
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
