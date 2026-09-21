import { getUrl, uploadData, remove } from 'aws-amplify/storage'
import { fetchAuthSession } from 'aws-amplify/auth'
import { saveAccountPreferences } from '../orders/preferences'
import { useAuthStore } from '../store/useAuthStore'
import { useOrderStore } from '../store/useOrderStore'

export const photoSource = async (path) => ({
  uri: (await getUrl({ path, options: { expiresIn: 3600 } })).url.toString(),
})
export const uploadProfilePhoto = async (file) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
    throw new Error('Choose a JPG, PNG, or WebP photo smaller than 5 MB.')
  const owner = useAuthStore.getState().user?.userId
  const { identityId } = await fetchAuthSession()
  if (!owner || !identityId) throw new Error('Please sign in again before uploading.')
  // Decode and re-encode: strip metadata and constrain image dimensions.
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height))
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) throw new Error('This photo could not be read. Please choose another.')
  const path = `profile-pictures/${identityId}/${crypto.randomUUID()}.jpg`
  const previous = useOrderStore.getState().pictureKey
  await uploadData({ path, data: blob, options: { contentType: 'image/jpeg' } }).result
  try {
    if (useAuthStore.getState().user?.userId !== owner)
      throw new Error('Your session changed. Please try again.')
    await saveAccountPreferences(owner, { pictureKey: path, pictureUrl: null })
  } catch (error) {
    await remove({ path }).catch(() => {})
    throw error
  }
  if (useAuthStore.getState().user?.userId === owner)
    useOrderStore.setState({ pictureKey: path, pictureUrl: '' })
  if (previous?.startsWith(`profile-pictures/${identityId}/`))
    await remove({ path: previous }).catch(() => {})
}
export const removeProfilePhoto = async () => {
  const owner = useAuthStore.getState().user?.userId
  if (!owner) throw new Error('Please sign in again.')
  const previous = useOrderStore.getState().pictureKey
  await saveAccountPreferences(owner, { pictureKey: null, pictureUrl: null })
  if (useAuthStore.getState().user?.userId === owner)
    useOrderStore.setState({ pictureKey: '', pictureUrl: '' })
  if (previous) await remove({ path: previous }).catch(() => {})
}
