import { fetchAuthSession } from 'aws-amplify/auth'
import { getUrl } from 'aws-amplify/storage'
import { dataClient, throwOnErrors } from '../orders/client'
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

export const imageForRecord = async (asset) => {
  if (asset?.path || asset?.imagePath) {
    try {
      return {
        uri: (
          await getUrl({ path: asset.path || asset.imagePath, options: { expiresIn: 3600 } })
        ).url.toString(),
      }
    } catch {
      return null
    }
  }
  return menu.find((item) => item.id === asset?.bundledId)?.image || null
}
export const fetchMenu = async () => {
  const session = await fetchAuthSession()
  const authMode = session.tokens ? 'userPool' : 'iam'
  const items = []
  let nextToken
  do {
    const raw = throwOnErrors(await dataClient.queries.publicMenu({ nextToken }, { authMode }))
    const page = typeof raw === 'string' ? JSON.parse(raw) : raw
    items.push(...(page?.items ?? []))
    nextToken = page?.nextToken
  } while (nextToken)
  return Promise.all(
    items
      .sort((a, b) => a.id - b.id)
      .map(async (item) => ({
        ...item,
        options: item.options?.length ? item.options : undefined,
        image: await imageForRecord(item),
      })),
  )
}
