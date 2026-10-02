// Keep a tombstone so bundled defaults cannot be recreated on a cold start.
export const deleteMenuPhoto = async (
  models: any,
  groups: string[],
  imageId: unknown,
  // eslint-disable-next-line no-unused-vars -- Parameter name in a function type.
  removeObjects: (keys: string[]) => Promise<void>,
) => {
  if (!groups.includes('super_admin')) throw new Error('NOT_AUTHORIZED')
  if (typeof imageId !== 'string' || !imageId || imageId.length > 100)
    throw new Error('INVALID_IMAGE_ID')
  const found = await models.MenuImage.get({ id: imageId })
  if (found.errors?.length || !found.data) throw new Error('IMAGE_NOT_FOUND')
  if (found.data.deleted) return { deleted: true }
  let nextToken: string | null | undefined
  do {
    const page = await models.MenuItem.list({
      limit: 100,
      nextToken,
      filter: { imageAssetId: { eq: imageId }, deleted: { eq: false } },
    })
    if (page.errors?.length) throw new Error('MENU_LOAD_FAILED')
    if (page.data.length) throw new Error('PHOTO_IN_USE')
    nextToken = page.nextToken
  } while (nextToken)
  const path = found.data.path
  if (path) {
    const main = 'menu-images/optimized/' + imageId + '/main.webp'
    const legacy = ['jpg', 'jpeg', 'png', 'webp'].map((ext) => 'menu-images/' + imageId + '.' + ext)
    if (path !== main && !legacy.includes(path)) throw new Error('INVALID_IMAGE_PATH')
    await removeObjects(path === main ? [path, path.replace('/main.webp', '/thumb.webp')] : [path])
  }
  const result = await models.MenuImage.update({ id: imageId, deleted: true })
  if (result.errors?.length) throw new Error('PHOTO_DELETE_FAILED')
  return { deleted: true }
}
