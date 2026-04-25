import VideoCard from './VideoCard'
import Spinner from '@/components/ui/Spinner'

export default function VideoFeed({ videos = [], isLoading, hasMore, onLoadMore }) {
  if (isLoading && videos.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {videos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center py-8">
          <button onClick={onLoadMore} className="btn-secondary" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" /> : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  )
}
