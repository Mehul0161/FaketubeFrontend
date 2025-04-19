import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchVideoById, toggleLike } from '../features/videos/videoSlice';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const VideoPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const { currentVideo, isLoading, error } = useSelector((state: RootState) => state.videos);
  const { user } = useSelector((state: RootState) => state.auth);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchVideoById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentVideo && user) {
      setIsLiked(currentVideo.likes?.includes(user.id) || false);
    }
  }, [currentVideo, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like videos');
      return;
    }

    try {
      await dispatch(toggleLike(currentVideo!.id)).unwrap();
      setIsLiked(!isLiked);
      toast.success(isLiked ? 'Video unliked' : 'Video liked');
    } catch (error) {
      toast.error('Failed to update like status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !currentVideo) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-red-600">Error loading video</h2>
        <p className="text-gray-600 mt-2">{error || 'Video not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Video Player */}
      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-8">
        <iframe
          src={`https://www.youtube.com/embed/${currentVideo.id}`}
          title={currentVideo.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>

      {/* Video Info */}
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{currentVideo.title}</h1>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={currentVideo.uploader.avatar}
              alt={currentVideo.uploader.displayName}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h2 className="font-semibold">{currentVideo.uploader.displayName}</h2>
              <p className="text-sm text-gray-600">
                {currentVideo.views.toLocaleString()} views • {formatDistanceToNow(new Date(currentVideo.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                isLiked
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{isLiked ? 'Liked' : 'Like'}</span>
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700 whitespace-pre-line">{currentVideo.description}</p>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer; 