import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ClipboardList, 
  Layout, 
  Folder, 
  Tag, 
  Calendar, 
  Clock,
  HelpCircle,
  Menu,
  X,
  Settings,
} from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Layout size={18} /> },
    { path: '/tasks', label: 'All Tasks', icon: <ClipboardList size={18} /> },
    { path: '/projects', label: 'Projects', icon: <Folder size={18} /> },
    { path: '/categories', label: 'Categories', icon: <Tag size={18} /> },
    { path: '/calendar', label: 'Calendar', icon: <Calendar size={18} /> },
    { path: '/planner', label: 'Daily Planner', icon: <Clock size={18} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <ClipboardList className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">TaskManager</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  isActive(item.path)
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                }`}
              >
                {item.icon}
                <span className="ml-1">{item.label}</span>
              </Link>
            ))}
          </nav>
          
          {/* What Now Button */}
          <Link
            to="/what-now"
            className="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <HelpCircle size={16} className="mr-1" />
            What Now?
          </Link>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive(item.path)
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </div>
            </Link>
          ))}
          
          <Link
            to="/what-now"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex items-center">
              <HelpCircle size={18} />
              <span className="ml-2">What Now?</span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;