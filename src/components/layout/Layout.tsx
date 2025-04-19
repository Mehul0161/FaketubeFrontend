import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const location = useLocation();
  
  // Check if we're on the home page or search page
  const showSidebar = location.pathname === '/' || location.pathname === '/search';
  
  // Get category from URL if present
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setCurrentCategory(categoryParam);
    }
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-grow flex">
        {showSidebar && (
          <div className="hidden md:block w-64 flex-shrink-0">
            <Sidebar 
              onCategoryChange={setCurrentCategory} 
              currentCategory={currentCategory} 
            />
          </div>
        )}
        <main className={`flex-grow ${showSidebar ? 'md:pl-0' : ''} container mx-auto px-4 py-8`}>
          <Outlet context={{ currentCategory, setCurrentCategory }} />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout; 