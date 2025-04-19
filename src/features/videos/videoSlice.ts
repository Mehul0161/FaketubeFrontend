import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

// YouTube API response interfaces
interface YouTubeVideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  channelTitle: string;
}

interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: YouTubeVideoSnippet;
}

interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeVideoItem[];
}

// Our app's video interface
interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: number;
  uploader: {
    id: string;
    displayName: string;
    avatar: string;
  };
  createdAt: string;
}

interface VideoState {
  videos: Video[];
  currentVideo: Video | null;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
}

const initialState: VideoState = {
  videos: [],
  currentVideo: null,
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
};

// Helper function to format duration from YouTube API
const formatDuration = (duration: string): string => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');
  
  let result = '';
  if (hours) result += `${hours}:`;
  result += `${minutes.padStart(2, '0')}:`;
  result += seconds.padStart(2, '0');
  
  return result;
};

// Helper function to format view count
const formatViewCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const fetchVideos = createAsyncThunk(
  'videos/fetchVideos',
  async ({ page = 1, category = '', sort = 'date' }: { page?: number; category?: string; sort?: string }, { rejectWithValue }) => {
    try {
      // First try to get videos from our cache
      try {
        const cachedResponse = await api.get('/videos/youtube/cached', {
          params: { page, category, sort, limit: 10 }
        });
        
        if (cachedResponse.data.videos && cachedResponse.data.videos.length > 0) {
          // Map cached videos to our format
          const videos = cachedResponse.data.videos.map((item: any) => ({
            id: item.youtubeId,
            title: item.title,
            description: item.description,
            thumbnail: item.thumbnailUrl,
            duration: item.duration,
            views: item.viewCount,
            createdAt: item.publishedAt,
            uploader: {
              id: item.channelId,
              displayName: item.channelTitle,
              avatar: `https://placehold.co/40?text=${item.channelTitle.charAt(0)}`,
            },
          }));
          
          return {
            videos,
            totalPages: cachedResponse.data.totalPages,
            nextPageToken: null,
            fromCache: true
          };
        }
      } catch (cacheError) {
        console.warn('Failed to fetch from cache, falling back to YouTube API:', cacheError);
        // Continue to YouTube API if cache fails
      }
      
      // If cache is empty or failed, use YouTube API
      const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!API_KEY) {
        throw new Error('YouTube API key is not configured');
      }

      // Map our sort parameter to YouTube API valid order parameters
      let orderParam = 'date'; // Default to date
      if (sort === 'trending') {
        orderParam = 'viewCount'; // Use viewCount for trending videos
      } else if (sort === 'date') {
        orderParam = 'date';
      } else if (sort === 'relevance') {
        orderParam = 'relevance';
      } else if (sort === 'rating') {
        orderParam = 'rating';
      } else if (sort === 'title') {
        orderParam = 'title';
      }

      // Build search parameters
      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: category || 'music', // Default to 'music' if category is empty
        type: 'video',
        maxResults: '10',
        order: orderParam,
        key: API_KEY,
      });

      // Add pagination token if needed
      if (page > 1 && localStorage.getItem('nextPageToken')) {
        searchParams.append('pageToken', localStorage.getItem('nextPageToken') || '');
      }

      console.log('Fetching videos with params:', searchParams.toString());
      
      // Fetch video list from YouTube API
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          // More detailed error message based on the error response
          const errorMessage = errorData.error?.message || 'Unknown error';
          const errorReason = errorData.error?.errors?.[0]?.reason || 'unknown';
          
          if (errorReason === 'quotaExceeded') {
            throw new Error('YouTube API quota exceeded. Please try again later.');
          } else if (errorReason === 'keyInvalid') {
            throw new Error('Invalid YouTube API key. Please check your configuration.');
          } else if (errorReason === 'keyExpired') {
            throw new Error('YouTube API key has expired. Please update your key.');
          } else {
            throw new Error(`YouTube API access denied: ${errorMessage}`);
          }
        }
        throw new Error(errorData.error?.message || 'Failed to fetch videos');
      }

      const data = await response.json();
      
      // Store next page token for pagination
      if (data.nextPageToken) {
        localStorage.setItem('nextPageToken', data.nextPageToken);
      }

      // Map YouTube data to our format and cache each video
      const videos = await Promise.all(data.items.map(async (item: any) => {
        try {
          // Get video details including statistics
          const detailsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${item.id.videoId}&key=${API_KEY}`
          );
          
          if (!detailsResponse.ok) {
            throw new Error('Failed to fetch video details');
          }
          
          const detailsData = await detailsResponse.json();
          const videoDetails = detailsData.items[0];

          // Cache the video in our database
          try {
            await api.post('/videos/youtube/cache', {
              youtubeId: item.id.videoId,
              category,
              sort
            });
          } catch (cacheError) {
            console.warn('Failed to cache video:', cacheError);
            // Continue even if caching fails
          }

          return {
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            duration: videoDetails?.contentDetails?.duration || 'N/A',
            views: parseInt(videoDetails?.statistics?.viewCount || '0'),
            createdAt: item.snippet.publishedAt,
            uploader: {
              id: item.snippet.channelId,
              displayName: item.snippet.channelTitle,
              avatar: `https://placehold.co/40?text=${item.snippet.channelTitle.charAt(0)}`,
            },
          };
        } catch (error) {
          console.error('Error fetching video details:', error);
          return null;
        }
      }));

      // Filter out any null values from failed detail fetches
      const validVideos = videos.filter((video): video is Video => video !== null);

      return {
        videos: validVideos,
        totalPages: Math.ceil(data.pageInfo.totalResults / 10),
        nextPageToken: data.nextPageToken,
        fromCache: false
      };
    } catch (error: any) {
      // Log the full error for debugging
      console.error('YouTube API Error:', error);
      
      // Show a user-friendly error message
      toast.error(error.message || 'Failed to fetch videos');
      
      // Return fallback data if it's the first page
      if (page === 1) {
        return {
          videos: getFallbackVideos(category),
          totalPages: 1,
          nextPageToken: null,
          fromCache: false
        };
      }
      
      return rejectWithValue(error.message);
    }
  }
);

// Fallback videos to show when the API fails
const getFallbackVideos = (category: string): Video[] => {
  const fallbackVideos: Video[] = [
    {
      id: 'fallback1',
      title: 'Sample Video 1',
      description: 'This is a sample video description. The YouTube API is currently unavailable.',
      thumbnail: 'https://placehold.co/640x360?text=Sample+Video+1',
      duration: '10:30',
      views: 1234,
      createdAt: new Date().toISOString(),
      uploader: {
        id: 'channel1',
        displayName: 'Sample Channel',
        avatar: 'https://placehold.co/40?text=SC',
      },
    },
    {
      id: 'fallback2',
      title: 'Sample Video 2',
      description: 'Another sample video description. Please check your API key configuration.',
      thumbnail: 'https://placehold.co/640x360?text=Sample+Video+2',
      duration: '8:45',
      views: 567,
      createdAt: new Date().toISOString(),
      uploader: {
        id: 'channel2',
        displayName: 'Demo Channel',
        avatar: 'https://placehold.co/40?text=DC',
      },
    },
    {
      id: 'fallback3',
      title: 'Sample Video 3',
      description: 'This is a placeholder video. The YouTube API quota may have been exceeded.',
      thumbnail: 'https://placehold.co/640x360?text=Sample+Video+3',
      duration: '15:20',
      views: 890,
      createdAt: new Date().toISOString(),
      uploader: {
        id: 'channel3',
        displayName: 'Test Channel',
        avatar: 'https://placehold.co/40?text=TC',
      },
    },
  ];
  
  return fallbackVideos;
};

export const fetchVideoById = createAsyncThunk(
  'videos/fetchVideoById',
  async (id: string) => {
    try {
      // First try to get video from our cache
      try {
        const cachedResponse = await api.get(`/videos/youtube/cached/${id}`);
        const cachedVideo = cachedResponse.data;
        
        if (cachedVideo) {
          // Map cached video to our format
          return {
            id: cachedVideo.youtubeId,
            title: cachedVideo.title,
            description: cachedVideo.description,
            thumbnail: cachedVideo.thumbnailUrl,
            duration: cachedVideo.duration,
            views: cachedVideo.viewCount,
            createdAt: cachedVideo.publishedAt,
            uploader: {
              id: cachedVideo.channelId,
              displayName: cachedVideo.channelTitle,
              avatar: `https://placehold.co/40?text=${cachedVideo.channelTitle.charAt(0)}`,
            },
            fromCache: true
          };
        }
      } catch (cacheError) {
        console.warn('Failed to fetch from cache, falling back to YouTube API:', cacheError);
        // Continue to YouTube API if cache fails
      }
      
      // If cache is empty or failed, use YouTube API
      const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
      
      if (!YOUTUBE_API_KEY) {
        throw new Error('YouTube API key is not configured');
      }
      
      // Fetch video details
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${id}&key=${YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.items.length === 0) {
        throw new Error('Video not found');
      }
      
      const video = data.items[0];
      
      // Cache the video in our database
      try {
        await api.post('/videos/youtube/cache', {
          youtubeId: id
        });
      } catch (cacheError) {
        console.warn('Failed to cache video:', cacheError);
        // Continue even if caching fails
      }
      
      // Map to our app's format
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high.url,
        duration: formatDuration(video.contentDetails.duration),
        views: parseInt(video.statistics.viewCount, 10),
        uploader: {
          id: video.snippet.channelId,
          displayName: video.snippet.channelTitle,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(video.snippet.channelTitle)}&background=random`,
        },
        createdAt: video.snippet.publishedAt,
        fromCache: false
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch video');
    }
  }
);

// These functions would still use your backend API
export const uploadVideo = createAsyncThunk(
  'videos/uploadVideo',
  async (videoData: FormData) => {
    const response = await api.post('/videos', videoData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
);

export const toggleLike = createAsyncThunk(
  'videos/toggleLike',
  async (videoId: string) => {
    const response = await api.post(`/videos/${videoId}/like`);
    return response.data;
  }
);

const videoSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Videos
      .addCase(fetchVideos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.videos = action.payload.videos;
        state.totalPages = action.payload.totalPages;
        state.currentPage++;
        
        // Log cache status
        if (action.payload.fromCache) {
          console.log('Videos loaded from cache');
        } else {
          console.log('Videos loaded from YouTube API');
        }
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        toast.error(state.error || 'Failed to fetch videos');
      })
      // Fetch Video by ID
      .addCase(fetchVideoById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVideoById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentVideo = action.payload;
        
        // Log cache status
        if (action.payload.fromCache) {
          console.log('Video loaded from cache');
        } else {
          console.log('Video loaded from YouTube API');
        }
      })
      .addCase(fetchVideoById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch video';
      })
      // Upload Video
      .addCase(uploadVideo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadVideo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.videos.unshift(action.payload);
      })
      .addCase(uploadVideo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to upload video';
      })
      // Toggle Like
      .addCase(toggleLike.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentVideo && state.currentVideo.id === action.payload.id) {
          state.currentVideo = action.payload;
        }
        const videoIndex = state.videos.findIndex(v => v.id === action.payload.id);
        if (videoIndex !== -1) {
          state.videos[videoIndex] = action.payload;
        }
      })
      .addCase(toggleLike.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to toggle like';
      });
  },
});

export const { clearError } = videoSlice.actions;
export default videoSlice.reducer; 