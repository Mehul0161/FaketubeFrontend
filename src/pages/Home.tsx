import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchVideos } from '../features/videos/videoSlice';
import VideoCard from '../components/VideoCard';
import { toast } from 'react-hot-toast';
import { useLocation, useOutletContext } from 'react-router-dom';

function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { videos, isLoading, error, totalPages, currentPage } = useSelector(
    (state: RootState) => state.videos
  );
  const [sort, setSort] = useState<string>('date');
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Get category from context with a default empty string if context is null
  const context = useOutletContext<{ currentCategory: string; setCurrentCategory: (category: string) => void }>();
  const currentCategory = context?.currentCategory || '';

  useEffect(() => {
    // Check if YouTube API key is configured
    const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      setApiError('YouTube API key is not configured. Please check your .env file.');
      toast.error('YouTube API key is not configured');
      return;
    }

    // Check if we're coming from a search page
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('q');
    
    if (searchQuery) {
      // If we have a search query, use it as the category
      dispatch(fetchVideos({ page: 1, category: searchQuery, sort: 'relevance' }))
        .unwrap()
        .catch((error) => {
          console.error('Error fetching videos:', error);
          setApiError(error.message || 'Failed to load videos');
          toast.error(error.message || 'Failed to load videos');
        });
    } else {
      // Otherwise, fetch videos based on the selected category
      dispatch(fetchVideos({ page: 1, category: currentCategory, sort }))
        .unwrap()
        .catch((error) => {
          console.error('Error fetching videos:', error);
          setApiError(error.message || 'Failed to load videos');
          toast.error(error.message || 'Failed to load videos');
        });
    }
  }, [dispatch, currentCategory, sort, location.search]);

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      dispatch(fetchVideos({ page: currentPage + 1, category: currentCategory, sort }))
        .unwrap()
        .catch((error) => {
          toast.error(error.message || 'Failed to load more videos');
        });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-end">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="date">Latest</option>
            <option value="viewCount">Trending</option>
            <option value="rating">Top Rated</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>
      </div>

      {isLoading && videos.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : error && videos.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-600">{error}</div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>

          {currentPage < totalPages && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Home; 