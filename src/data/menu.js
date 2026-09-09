const chickenPoppersImage = require('../../assets/images/chicken-poppers.png')
const chickenTocinoImage = require('../../assets/images/chicken-tocino.png')
const cordonBlueImage = require('../../assets/images/cordon-blue.png')
const shomaiRiceImage = require('../../assets/images/shomai-rice-v2.png')
const fruitSodaImage = require('../../assets/images/fruit-soda.png')

const menu = [
  {
    id: 1,
    name: { en: 'Chicken Poppers', tl: 'Chicken Poppers' },
    description: {
      en: 'Crispy, bite-sized chicken poppers served hot and freshly cooked.',
      tl: 'Malutong na chicken poppers na bagong luto at inihahain nang mainit.',
    },
    price: 60,
    category: 'food',
    image: chickenPoppersImage,
    badge: 'popular',
    rating: 4.9,
  },
  {
    id: 2,
    name: { en: 'Chicken Tocino', tl: 'Chicken Tocino' },
    description: {
      en: 'Sweet and savory chicken tocino served as a satisfying rice meal.',
      tl: 'Matamis at malasang chicken tocino na inihahain kasama ng kanin.',
    },
    price: 70,
    category: 'food',
    image: chickenTocinoImage,
    rating: 4.8,
  },
  {
    id: 3,
    name: { en: 'Cordon Blue', tl: 'Cordon Blue' },
    description: {
      en: 'A savory chicken wrap inspired by classic chicken cordon bleu.',
      tl: 'Malasang chicken wrap na hango sa classic chicken cordon bleu.',
    },
    price: 70,
    category: 'food',
    image: cordonBlueImage,
    rating: 4.8,
  },
  {
    id: 4,
    name: { en: 'Shomai Rice', tl: 'Shomai Rice' },
    description: {
      en: 'Steamed pork shomai stuffed with rice and served with a savory dipping sauce.',
      tl: 'Steamed pork shomai na pinalamanan ng kanin at may malasang sawsawan.',
    },
    price: 60,
    category: 'food',
    image: shomaiRiceImage,
    badge: 'bestSeller',
    rating: 4.9,
  },
  {
    id: 5,
    name: { en: 'Fruit Soda', tl: 'Fruit Soda' },
    description: {
      en: 'A sparkling fruit soda made fresh in your choice of flavor.',
      tl: 'Nakakapreskong fruit soda na bagong gawa sa flavor na gusto mo.',
    },
    price: 39,
    category: 'drink',
    image: fruitSodaImage,
    options: [
      { id: 'blueberry', name: { en: 'Blueberry', tl: 'Blueberry' } },
      { id: 'strawberry', name: { en: 'Strawberry', tl: 'Strawberry' } },
      { id: 'green-apple', name: { en: 'Green Apple', tl: 'Green Apple' } },
      { id: 'lychee', name: { en: 'Lychee', tl: 'Lychee' } },
    ],
    rating: 4.8,
  },
]

export const categories = ['all', 'food', 'drink']

// Replace this function with an Amplify Data query later. The React Query consumer stays the same.
export const fetchMenu = async () => {
  await new Promise((resolve) => setTimeout(resolve, 220))
  return menu
}
