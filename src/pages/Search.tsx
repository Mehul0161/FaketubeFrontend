import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { AppDispatch, RootState } from '../store';
import { fetchVideos } from '../features/videos/videoSlice';
import VideoCard from '../components/VideoCard';
import { toast } from 'react-hot-toast';

function Search() {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const { videos, isLoading, error, totalPages, currentPage } = useSelector(
    (state: RootState) => state.videos
  );
  const [sort, setSort] = useState<string>('relevance');
  const [apiError, setApiError] = useState<string | null>(null);

  // Get setCurrentCategory from context with a default empty function if context is null
  const context = useOutletContext<{ setCurrentCategory: (category: string) => void }>();
  const setCurrentCategory = context?.setCurrentCategory || (() => {});

  useEffect(() => {
    // Check if YouTube API key is configured
    const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      setApiError('YouTube API key is not configured. Please check your .env file.');
      toast.error('YouTube API key is not configured');
      return;
    }

    if (searchTerm) {
      setCurrentCategory(searchTerm);
      dispatch(fetchVideos({ page: 1, category: searchTerm, sort }))
        .unwrap()
        .catch((error) => {
          console.error('Error fetching search results:', error);
          setApiError(error.message || 'Failed to load search results');
          toast.error(error.message || 'Failed to load search results');
        });
    }
  }, [dispatch, searchTerm, sort, setCurrentCategory]);

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      dispatch(fetchVideos({ page: currentPage + 1, category: searchTerm, sort }))
        .unwrap()
        .catch((error) => {
          toast.error(error.message || 'Failed to load more videos');
        });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Search Results for "{searchTerm}"</h1>
        <div className="flex justify-end">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="relevance">Most Relevant</option>
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
      ) : videos.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600">No videos found for "{searchTerm}"</div>
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

export default Search; 