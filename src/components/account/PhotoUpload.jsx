import { useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { uploadProfilePhoto, removeProfilePhoto } from '../../storage/photos'

export const PhotoUpload = () => {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(
    'Choose a JPG, PNG, or WebP photo up to 5 MB. Your initials are used if no photo is uploaded.',
  )
  const run = async (action) => {
    setBusy(true)
    try {
      await action()
      setMessage('Your profile photo has been updated.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }
  const pick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp'
    input.onchange = () => {
      if (input.files?.[0]) void run(() => uploadProfilePhoto(input.files[0]))
    }
    input.click()
  }
  return (
    <View style={{ gap: 12, marginBottom: 24 }}>
      <Text accessibilityLiveRegion="polite" style={{ color: '#666' }}>
        {message}
      </Text>
      {Platform.OS === 'web' && (
        <Pressable accessibilityRole="button" disabled={busy} onPress={pick}>
          <Text style={{ color: '#238347', fontWeight: 'bold' }}>
            {busy ? 'Updating photo…' : 'Upload profile photo'}
          </Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void run(removeProfilePhoto)}
      >
        <Text style={{ color: '#b42318' }}>Remove photo and use initials</Text>
      </Pressable>
    </View>
  )
}
