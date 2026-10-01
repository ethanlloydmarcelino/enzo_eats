export const phoneCountries = [
  {
    id: 'PH',
    name: 'Philippines',
    flag: '\u{1F1F5}\u{1F1ED}',
    code: '63',
    trunk: true,
    pattern: /^9\d{9}$/,
    example: '09171234567',
  },
  {
    id: 'US',
    name: 'USA',
    flag: '\u{1F1FA}\u{1F1F8}',
    code: '1',
    pattern: /^[2-9]\d{2}[2-9]\d{6}$/,
    example: '2025550123',
  },
  {
    id: 'CA',
    name: 'Canada',
    flag: '\u{1F1E8}\u{1F1E6}',
    code: '1',
    pattern: /^[2-9]\d{2}[2-9]\d{6}$/,
    example: '4165550123',
  },
  {
    id: 'JP',
    name: 'Japan',
    flag: '\u{1F1EF}\u{1F1F5}',
    code: '81',
    trunk: true,
    pattern: /^[1-9]\d{8,9}$/,
    example: '09012345678',
  },
  {
    id: 'SG',
    name: 'Singapore',
    flag: '\u{1F1F8}\u{1F1EC}',
    code: '65',
    pattern: /^[3689]\d{7}$/,
    example: '81234567',
  },
  {
    id: 'TW',
    name: 'Taiwan',
    flag: '\u{1F1F9}\u{1F1FC}',
    code: '886',
    trunk: true,
    pattern: /^[1-9]\d{7,8}$/,
    example: '0912345678',
  },
  {
    id: 'AE',
    name: 'Dubai / UAE',
    flag: '\u{1F1E6}\u{1F1EA}',
    code: '971',
    trunk: true,
    pattern: /^[1-9]\d{7,8}$/,
    example: '0501234567',
  },
]
const clean = (value) => (value ?? '').replace(/[\s().-]/g, '')
export const normalizePhone = (value, countryId) => {
  let number = clean(value)
  // Preserve existing international profiles when no selector value is provided.
  if (!countryId) return number
  const country = phoneCountries.find((item) => item.id === countryId)
  if (!country) return 'invalid'
  if (number.startsWith('+')) {
    if (!number.startsWith('+' + country.code)) return 'invalid'
    number = number.slice(country.code.length + 1)
  } else if (country.trunk && number.startsWith('0')) number = number.slice(1)
  else if (country.code === '1' && number.length === 11 && number.startsWith('1'))
    number = number.slice(1)
  return country.pattern.test(number) ? '+' + country.code + number : number ? 'invalid' : ''
}
export const phoneFormValues = (value) => {
  const number = clean(value)
  const country = phoneCountries.find((item) => number.startsWith('+' + item.code))
  if (!country) return { phoneCountry: 'PH', phoneNumber: value || '' }
  const local = number.slice(country.code.length + 1)
  return { phoneCountry: country.id, phoneNumber: (country.trunk ? '0' : '') + local }
}
