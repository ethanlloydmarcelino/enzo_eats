import { create } from 'zustand'
export const useNotificationStore = create(() => ({ owner: null, unread: 0 }))
