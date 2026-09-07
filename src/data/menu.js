const mealImage = require('../../assets/images/filipino-rice-meals.png')

const menu = [
  {
    id: 1,
    name: 'Shomai and Rice',
    description: 'Steamed pork shomai, white rice, and a savory soy-chili dipping sauce.',
    price: 9,
    category: 'Rice Meal',
    image: mealImage,
    crop: { x: 0, y: 0 },
    badge: 'Popular',
    rating: 4.9,
  },
  {
    id: 2,
    name: 'Chicken and Rice',
    description: 'Crispy seasoned chicken served with a generous portion of white rice.',
    price: 12,
    category: 'Rice Meal',
    image: mealImage,
    crop: { x: 1, y: 0 },
    rating: 4.8,
  },
  {
    id: 3,
    name: 'Beef and Rice',
    description: 'Tender savory beef with onions, scallions, and freshly steamed white rice.',
    price: 13,
    category: 'Rice Meal',
    image: mealImage,
    crop: { x: 0, y: 1 },
    rating: 4.8,
  },
  {
    id: 4,
    name: 'Sisig and Rice',
    description: 'Sizzling chopped pork sisig with onions, chili, citrus, and white rice.',
    price: 11,
    category: 'Rice Meal',
    image: mealImage,
    crop: { x: 1, y: 1 },
    badge: 'Best seller',
    rating: 4.9,
  },
]

export const categories = ['All', 'Rice Meal']

// Replace this function with an Amplify Data query later. The React Query consumer stays the same.
export const fetchMenu = async () => {
  await new Promise((resolve) => setTimeout(resolve, 220))
  return menu
}
