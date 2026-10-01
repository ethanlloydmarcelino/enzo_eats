import Svg, { Circle, G, Path, Polygon, Rect } from 'react-native-svg'
const Star = ({ x, y, size = 1, color = '#fff' }) => (
  <Polygon
    points="0,-1 0.2245,-0.309 0.9511,-0.309 0.3633,0.118 0.5878,0.809 0,0.382 -0.5878,0.809 -0.3633,0.118 -0.9511,-0.309 -0.2245,-0.309"
    fill={color}
    transform={'translate(' + x + ' ' + y + ') scale(' + size + ')'}
  />
)
// Bundled vector flags also render on browsers without flag-emoji support.
export const CountryFlag = ({ country }) => (
  <Svg width={28} height={19} viewBox="0 0 30 20" aria-hidden={true} focusable={false}>
    <Rect width="30" height="20" fill="#fff" />
    {country === 'PH' && (
      <>
        <Rect width="30" height="10" fill="#0038a8" />
        <Rect y="10" width="30" height="10" fill="#ce1126" />
        <Polygon points="0,0 17.32,10 0,20" fill="#fff" />
        <Circle cx="6" cy="10" r="2" fill="#fcd116" />
        {Array.from({ length: 8 }, (_, i) => (
          <Path
            key={i}
            d="M6 6.5 L6 8"
            stroke="#fcd116"
            strokeWidth="0.8"
            transform={'rotate(' + i * 45 + ' 6 10)'}
          />
        ))}
        <Star x={2} y={3} color="#fcd116" />
        <Star x={2} y={17} color="#fcd116" />
        <Star x={13} y={10} color="#fcd116" />
      </>
    )}
    {country === 'US' && (
      <>
        {Array.from({ length: 7 }, (_, i) => (
          <Rect key={i} y={(i * 40) / 13} width="30" height={20 / 13} fill="#b22234" />
        ))}
        <Rect width="12" height={140 / 13} fill="#3c3b6e" />
        {Array.from({ length: 9 }, (_, row) =>
          Array.from({ length: row % 2 ? 5 : 6 }, (_, col) => (
            <Star key={row + '-' + col} x={1 + col * 2 + (row % 2)} y={1 + row * 1.1} size={0.4} />
          )),
        )}
      </>
    )}
    {country === 'CA' && (
      <>
        <Rect width="7" height="20" fill="#d80621" />
        <Rect x="23" width="7" height="20" fill="#d80621" />
        <Path
          fill="#d80621"
          d="M15 3 L16.5 6.5 18 5.5 17.5 10 20 8.5 20 10.5 22 10 21 13 17 14 17.5 15 15.5 14.7 15.5 18 14.5 18 14.5 14.7 12.5 15 13 14 9 13 8 10 10 10.5 10 8.5 12.5 10 12 5.5 13.5 6.5 Z"
        />
      </>
    )}
    {country === 'JP' && <Circle cx="15" cy="10" r="6" fill="#bc002d" />}
    {country === 'SG' && (
      <>
        <Rect width="30" height="10" fill="#ef3340" />
        <Circle cx="6" cy="5" r="3.6" fill="#fff" />
        <Circle cx="7.5" cy="5" r="3" fill="#ef3340" />
        {[
          [11, 2],
          [13, 3.5],
          [12.3, 6],
          [9.7, 6],
          [9, 3.5],
        ].map(([x, y]) => (
          <Star key={x} x={x} y={y} size={0.8} />
        ))}
      </>
    )}
    {country === 'TW' && (
      <>
        <Rect width="30" height="20" fill="#fe0000" />
        <Rect width="15" height="10" fill="#000095" />
        <G>
          {Array.from({ length: 12 }, (_, i) => (
            <Polygon
              key={i}
              points="7.5,1 6.7,3.5 8.3,3.5"
              fill="#fff"
              transform={'rotate(' + i * 30 + ' 7.5 5)'}
            />
          ))}
          <Circle cx="7.5" cy="5" r="2.2" fill="#000095" />
          <Circle cx="7.5" cy="5" r="1.9" fill="#fff" />
        </G>
      </>
    )}
    {country === 'AE' && (
      <>
        <Rect width="30" height={20 / 3} fill="#00732f" />
        <Rect y={40 / 3} width="30" height={20 / 3} fill="#000" />
        <Rect width="7.5" height="20" fill="#f00" />
      </>
    )}
    <Rect
      x="0.25"
      y="0.25"
      width="29.5"
      height="19.5"
      fill="none"
      stroke="#888"
      strokeWidth="0.5"
    />
  </Svg>
)
