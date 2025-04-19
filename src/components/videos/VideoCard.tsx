import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Video } from '../../features/videos/videoSlice';

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  return (
    <Link to={`/video/${video.id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {/* Thumbnail */}
        <div className="relative aspect-video">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Video Info */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{video.title}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{video.views.toLocaleString()} views</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Channel Info */}
        <div className="px-4 pb-4 flex items-center space-x-3">
          <img
            src={video.channel.avatar}
            alt={video.channel.displayName}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <p className="text-sm font-medium">{video.channel.displayName}</p>
            <p className="text-xs text-gray-600">{video.channel.subscribers.toLocaleString()} subscribers</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard; 