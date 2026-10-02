import { randomInt } from 'node:crypto'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
import { env } from '$amplify/env/menu-catalog'
import type { Schema } from '../../data/resource'
import type { AppSyncResolverEvent, AppSyncIdentityCognito } from 'aws-lambda'
import { ensureMenuDefaults } from './seed'
import { validateMenu } from './validation'
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)
Amplify.configure(resourceConfig, libraryOptions)
const client = generateClient<Schema>()
let initialized = false
export const handler = async (
  event: AppSyncResolverEvent<{ action?: string; input?: unknown; nextToken?: string }>,
) => {
  const { action } = event.arguments
  const identity = event.identity as AppSyncIdentityCognito
  if (
    action &&
    !identity?.claims?.['cognito:groups']?.some((group: string) =>
      ['admin', 'super_admin'].includes(group),
    )
  )
    throw new Error('NOT_AUTHORIZED')
  if (!initialized) {
    await ensureMenuDefaults(client.models)
    initialized = true
  }
  if (!action) {
    const page = await client.models.MenuItem.list({
      limit: 50,
      nextToken: event.arguments.nextToken,
      filter: { visible: { eq: true }, deleted: { eq: false } },
    })
    if (page.errors?.length) throw new Error('MENU_LOAD_FAILED')
    const items = await Promise.all(
      page.data.map(async (item) => {
        const image = item.imageAssetId
          ? await client.models.MenuImage.get({ id: item.imageAssetId })
          : null
        if (image?.errors?.length) throw new Error('MENU_IMAGE_LOAD_FAILED')
        return {
          id: Number(item.id),
          name: { en: item.name, tl: item.nameTl || item.name },
          description: { en: item.description, tl: item.descriptionTl || item.description },
          price: item.price,
          category: item.category,
          available: item.available,
          imagePath: image?.data?.path,
          bundledId: image?.data?.bundledId,
          options: item.options
            ?.filter(Boolean)
            .map((name) => ({
              id: name!.toLowerCase().replace(/\s+/g, '-'),
              name: { en: name, tl: name },
            })),
        }
      }),
    )
    return { items, nextToken: page.nextToken }
  }
  if (action === 'INITIALIZE') return { initialized: true }
  const input: any =
    typeof event.arguments.input === 'string'
      ? JSON.parse(event.arguments.input)
      : event.arguments.input
  if (!input || typeof input !== 'object') throw new Error('INVALID_INPUT')
  const id = input.id ? String(input.id) : String(randomInt(1000, 2147483647))
  if (!/^[1-9]\d{0,9}$/.test(id) || Number(id) > 2147483647) throw new Error('INVALID_MENU_ID')
  const existing = input.id ? await client.models.MenuItem.get({ id }) : null
  if (existing?.errors?.length || (input.id && !existing?.data))
    throw new Error('MENU_ITEM_NOT_FOUND')
  if (existing?.data?.deleted) throw new Error('MENU_ITEM_DELETED')
  if (input.id && input.updatedAt !== existing?.data?.updatedAt)
    throw new Error('MENU_CHANGED_REFRESH')
  if (!['SAVE', 'DELETE'].includes(action)) throw new Error('INVALID_ACTION')
  if (action === 'DELETE' && !existing?.data) throw new Error('MENU_ITEM_NOT_FOUND')
  const values =
    action === 'DELETE'
      ? { deleted: true, visible: false, available: false }
      : { ...validateMenu(input), deleted: false }
  if ('imageAssetId' in values && values.imageAssetId) {
    const asset = await client.models.MenuImage.get({ id: values.imageAssetId })
    if (asset.errors?.length || !asset.data) throw new Error('IMAGE_NOT_FOUND')
  }
  const record = { id, ...values, updatedBy: identity.sub || identity.claims.sub }
  if (existing?.data) {
    const result: any = await client.graphql({
      query:
        'mutation SaveMenu($input: UpdateMenuItemInput!, $condition: ModelMenuItemConditionInput) { updateMenuItem(input: $input, condition: $condition) { id } }',
      variables: { input: record, condition: { updatedAt: { eq: input.updatedAt } } },
    })
    if (result.errors?.length) throw new Error('MENU_CHANGED_REFRESH')
  } else {
    const result = await client.models.MenuItem.create(
      record as Parameters<typeof client.models.MenuItem.create>[0],
    )
    if (result.errors?.length) throw new Error('MENU_SAVE_FAILED')
  }
  return { id, saved: true }
}
