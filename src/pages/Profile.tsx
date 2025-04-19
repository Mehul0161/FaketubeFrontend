import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchUserProfile, toggleSubscription } from '../features/users/userSlice';
import { fetchVideos } from '../features/videos/videoSlice';
import { UserCircleIcon, VideoCameraIcon, PlayIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { profile, isLoading: isProfileLoading } = useSelector((state: RootState) => state.auth);
  const { videos, isLoading: isVideosLoading } = useSelector((state: RootState) => state.videos);
  const [activeTab, setActiveTab] = useState<'videos' | 'playlists'>('videos');

  useEffect(() => {
    if (username) {
      dispatch(fetchUserProfile(username));
      dispatch(fetchVideos({ category: username }));
    }
  }, [dispatch, username]);

  const handleSubscribe = async () => {
    if (!currentUser) {
      toast.error('Please log in to subscribe');
      navigate('/login');
      return;
    }

    try {
      await dispatch(toggleSubscription(profile?.id)).unwrap();
      toast.success(profile?.isSubscribed ? 'Unsubscribed successfully' : 'Subscribed successfully');
    } catch (error) {
      toast.error('Failed to update subscription');
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <UserCircleIcon className="h-24 w-24 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900">User not found</h2>
        <p className="text-gray-500 mt-2">The user you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center -mt-16 sm:-mt-12">
            <div className="relative">
              <img
                src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.username}&background=random`}
                alt={profile.username}
                className="h-24 w-24 rounded-full border-4 border-white shadow-lg"
              />
              {profile.isVerified && (
                <div className="absolute bottom-0 right-0 bg-primary-500 rounded-full p-1">
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
                  <p className="text-gray-500">@{profile.username}</p>
                </div>
                {currentUser?.id !== profile.id && (
                  <button
                    onClick={handleSubscribe}
                    className={`mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      profile.isSubscribed
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-primary-600 hover:bg-primary-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                  >
                    {profile.isSubscribed ? (
                      <>
                        <UserMinusIcon className="h-5 w-5 mr-2" />
                        Unsubscribe
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="h-5 w-5 mr-2" />
                        Subscribe
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="mt-4 flex space-x-6">
                <div className="text-center">
                  <span className="text-2xl font-bold text-gray-900">{profile.subscriberCount}</span>
                  <span className="block text-sm text-gray-500">Subscribers</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold text-gray-900">{profile.videoCount}</span>
                  <span className="block text-sm text-gray-500">Videos</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold text-gray-900">{profile.viewCount}</span>
                  <span className="block text-sm text-gray-500">Views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('videos')}
            className={`${
              activeTab === 'videos'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <VideoCameraIcon className="h-5 w-5 mr-2" />
            Videos
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`${
              activeTab === 'playlists'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <PlayIcon className="h-5 w-5 mr-2" />
            Playlists
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-8">
        {activeTab === 'videos' ? (
          isVideosLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                  onClick={() => navigate(`/watch/${video.id}`)}
                >
                  <div className="relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{video.views} views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No videos</h3>
              <p className="mt-1 text-sm text-gray-500">This user hasn't uploaded any videos yet.</p>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <PlayIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No playlists</h3>
            <p className="mt-1 text-sm text-gray-500">This user hasn't created any playlists yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 