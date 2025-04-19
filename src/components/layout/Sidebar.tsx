import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onCategoryChange: (category: string) => void;
  currentCategory: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onCategoryChange, currentCategory }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const categories = [
    'All',
    'Music',
    'Gaming',
    'News',
    'Sports',
    'Technology',
    'Education',
    'Entertainment',
  ];

  const handleCategoryClick = (category: string) => {
    const selectedCategory = category === 'All' ? '' : category;
    onCategoryChange(selectedCategory);
    
    // If we're not on the home page, navigate there with the category
    if (location.pathname !== '/') {
      navigate(`/?category=${encodeURIComponent(selectedCategory)}`);
    }
  };

  return (
    <div className="w-64 bg-white shadow-sm h-full py-4">
      <div className="px-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
      </div>
      <ul className="space-y-1">
        {categories.map((category) => (
          <li key={category}>
            <button
              onClick={() => handleCategoryClick(category)}
              className={`w-full text-left px-4 py-2 text-sm ${
                currentCategory === (category === 'All' ? '' : category)
                  ? 'bg-red-50 text-red-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar; 