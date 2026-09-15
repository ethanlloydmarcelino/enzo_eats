import {
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins'
import { useFonts } from 'expo-font'

// Poppins swaps in for the system font on bolded, display-heavy text (headings,
// eyebrows, prices, buttons). Pick the family whose weight is closest to the
// fontWeight it's replacing, and drop the fontWeight prop alongside it.
export const fonts = {
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
  black: 'Poppins_900Black',
}

export const useAppFonts = () =>
  useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  })
