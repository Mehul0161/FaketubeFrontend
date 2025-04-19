import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  bio: string;
  subscribers: string[];
  subscriptions: string[];
  watchHistory: {
    video: {
      id: string;
      title: string;
      thumbnailUrl: string;
      views: number;
      createdAt: string;
    };
    watchedAt: string;
  }[];
  likedVideos: string[];
  playlists: {
    id: string;
    name: string;
    videos: string[];
  }[];
}

interface UserState {
  currentUser: User | null;
  userProfile: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  userProfile: null,
  isLoading: false,
  error: null,
};

export const fetchUserProfile = createAsyncThunk(
  'users/fetchUserProfile',
  async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }
);

export const toggleSubscription = createAsyncThunk(
  'users/toggleSubscription',
  async (userId: string) => {
    const response = await api.post(`/users/${userId}/subscribe`);
    return response.data;
  }
);

export const getWatchHistory = createAsyncThunk(
  'users/getWatchHistory',
  async () => {
    const response = await api.get('/users/me/history');
    return response.data;
  }
);

export const getLikedVideos = createAsyncThunk(
  'users/getLikedVideos',
  async () => {
    const response = await api.get('/users/me/liked');
    return response.data;
  }
);

export const createPlaylist = createAsyncThunk(
  'users/createPlaylist',
  async (name: string) => {
    const response = await api.post('/users/me/playlists', { name });
    return response.data;
  }
);

export const addToPlaylist = createAsyncThunk(
  'users/addToPlaylist',
  async ({ playlistId, videoId }: { playlistId: string; videoId: string }) => {
    const response = await api.post(`/users/me/playlists/${playlistId}/videos`, {
      videoId,
    });
    return response.data;
  }
);

export const updateUserProfile = createAsyncThunk(
  'users/updateUserProfile',
  async (userData: { displayName?: string; bio?: string; avatar?: File }) => {
    const formData = new FormData();
    
    if (userData.displayName) formData.append('displayName', userData.displayName);
    if (userData.bio) formData.append('bio', userData.bio);
    if (userData.avatar) formData.append('avatar', userData.avatar);
    
    const response = await api.patch('/users/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userProfile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch user profile';
      })
      // Toggle Subscription
      .addCase(toggleSubscription.fulfilled, (state, action) => {
        if (state.userProfile) {
          state.userProfile.subscribers = action.payload.subscriberCount;
        }
      })
      // Get Watch History
      .addCase(getWatchHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getWatchHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentUser) {
          state.currentUser.watchHistory = action.payload;
        }
      })
      .addCase(getWatchHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch watch history';
      })
      // Get Liked Videos
      .addCase(getLikedVideos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getLikedVideos.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentUser) {
          state.currentUser.likedVideos = action.payload;
        }
      })
      .addCase(getLikedVideos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch liked videos';
      })
      // Create Playlist
      .addCase(createPlaylist.fulfilled, (state, action) => {
        if (state.currentUser) {
          state.currentUser.playlists.push(action.payload);
        }
      })
      // Add to Playlist
      .addCase(addToPlaylist.fulfilled, (state, action) => {
        if (state.currentUser) {
          const playlist = state.currentUser.playlists.find(
            (p) => p.id === action.meta.arg.playlistId
          );
          if (playlist) {
            playlist.videos.push(action.meta.arg.videoId);
          }
        }
      })
      // Update User Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentUser) {
          state.currentUser = {
            ...state.currentUser,
            ...action.payload
          };
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update profile';
      });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer; 