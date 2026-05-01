import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { creatorsApi, videosApi } from '@/services/api'

export const useSocialStore = create(
  persist(
    (set, get) => ({
      likedVideos:   [],
      followedUsers: [],

      toggleLike: (videoId) => {
        const { likedVideos } = get()
        const liked = likedVideos.includes(videoId)
        set({ likedVideos: liked
          ? likedVideos.filter(id => id !== videoId)
          : [...likedVideos, videoId],
        })
        if (!liked) videosApi.like(videoId).catch(() => {})
      },

      toggleFollow: (username) => {
        const { followedUsers } = get()
        const following = followedUsers.includes(username)
        set({ followedUsers: following
          ? followedUsers.filter(u => u !== username)
          : [...followedUsers, username],
        })
        creatorsApi.follow(username).catch(() => {})
      },

      isLiked:     (videoId)  => get().likedVideos.includes(videoId),
      isFollowing: (username) => get().followedUsers.includes(username),
    }),
    { name: 'cannapont-social' },
  ),
)
