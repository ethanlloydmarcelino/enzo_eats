const mealImage = require('../../assets/images/filipino-rice-meals.png')

const menu = [
  {
    id: 1,
    name: { en: 'Shomai and Rice', tl: 'Siomai at Kanin' },
    description: {
      en: 'Steamed pork shomai, white rice, and a savory soy-chili dipping sauce.',
      tl: 'Steamed pork siomai, puting kanin, at malasang sawsawang toyo at sili.',
    },
    price: 9,
    category: 'riceMeal',
    image: mealImage,
    crop: { x: 0, y: 0 },
    badge: 'popular',
    rating: 4.9,
  },
  {
    id: 2,
    name: { en: 'Chicken and Rice', tl: 'Manok at Kanin' },
    description: {
      en: 'Crispy seasoned chicken served with a generous portion of white rice.',
      tl: 'Malutong at tinimplahang manok na may masaganang puting kanin.',
    },
    price: 12,
    category: 'riceMeal',
    image: mealImage,
    crop: { x: 1, y: 0 },
    rating: 4.8,
  },
  {
    id: 3,
    name: { en: 'Beef and Rice', tl: 'Baka at Kanin' },
    description: {
      en: 'Tender savory beef with onions, scallions, and freshly steamed white rice.',
      tl: 'Malambot at malasang baka na may sibuyas, dahon ng sibuyas, at bagong saing na kanin.',
    },
    price: 13,
    category: 'riceMeal',
    image: mealImage,
    crop: { x: 0, y: 1 },
    rating: 4.8,
  },
  {
    id: 4,
    name: { en: 'Sisig and Rice', tl: 'Sisig at Kanin' },
    description: {
      en: 'Sizzling chopped pork sisig with onions, chili, citrus, and white rice.',
      tl: 'Mainit na pork sisig na may sibuyas, sili, kalamansi, at puting kanin.',
    },
    price: 11,
    category: 'riceMeal',
    image: mealImage,
    crop: { x: 1, y: 1 },
    badge: 'bestSeller',
    rating: 4.9,
  },
]

export const categories = ['all', 'riceMeal']

// Replace this function with an Amplify Data query later. The React Query consumer stays the same.
export const fetchMenu = async () => {
  await new Promise((resolve) => setTimeout(resolve, 220))
  return menu
}
