import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useVideosStore = create(
  persist(
    (set) => ({
      videos: [],

      addVideo: (video) => set(s => ({
        videos: [video, ...s.videos],
      })),

      removeVideo: (id) => set(s => ({
        videos: s.videos.filter(v => v.id !== id),
      })),
    }),
    { name: 'cannapunk-videos' },
  ),
)
