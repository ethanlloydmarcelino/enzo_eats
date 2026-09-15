import Svg, { Rect } from 'react-native-svg'

// A flat, geometric "E" built from three rounded bars (the middle one short),
// drawn as vector art instead of a system-font glyph — reads crisp at any size
// and stays identical across platforms and font-loading states.
export const BrandMark = ({ size = 20, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="0" y="2.5" width="24" height="4.5" rx="2.25" fill={color} />
    <Rect x="0" y="9.75" width="16" height="4.5" rx="2.25" fill={color} />
    <Rect x="0" y="17" width="24" height="4.5" rx="2.25" fill={color} />
  </Svg>
)
