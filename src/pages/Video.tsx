import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchVideoById, toggleLike } from '../features/videos/videoSlice';
import { formatDistanceToNow } from 'date-fns';
import { HeartIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const Video = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const { currentVideo, isLoading } = useSelector((state: RootState) => state.videos);
  const { user } = useSelector((state: RootState) => state.auth);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchVideoById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentVideo && user) {
      setIsLiked(currentVideo.likes.includes(user.id));
    }
  }, [currentVideo, user]);

  const handleLike = () => {
    if (id && user) {
      dispatch(toggleLike(id));
      setIsLiked(!isLiked);
    }
  };

  if (isLoading || !currentVideo) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Video Player */}
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <video
          src={currentVideo.videoUrl}
          controls
          className="w-full h-full"
          poster={currentVideo.thumbnailUrl}
        />
      </div>

      {/* Video Info */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">{currentVideo.title}</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={currentVideo.creator.avatar}
              alt={currentVideo.creator.displayName}
              className="h-10 w-10 rounded-full"
            />
            <div>
              <p className="font-medium text-gray-900">{currentVideo.creator.displayName}</p>
              <p className="text-sm text-gray-500">
                {currentVideo.views.toLocaleString()} views •{' '}
                {formatDistanceToNow(new Date(currentVideo.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className="flex items-center space-x-2 text-gray-700 hover:text-primary-600"
            >
              {isLiked ? (
                <HeartIconSolid className="h-6 w-6 text-primary-600" />
              ) : (
                <HeartIcon className="h-6 w-6" />
              )}
              <span>{currentVideo.likes.length}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-700 hover:text-primary-600">
              <ShareIcon className="h-6 w-6" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Video Description */}
      <div className="prose max-w-none">
        <p className="text-gray-700 whitespace-pre-wrap">{currentVideo.description}</p>
      </div>
    </div>
  );
};

export default Video; 