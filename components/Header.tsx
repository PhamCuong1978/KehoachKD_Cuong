
import React from 'react';
import { MenuIcon } from './icons/MenuIcon';

// Cập nhật phiên bản tại đây
const APP_VERSION = '5.5.0';

interface HeaderProps {
  title: string;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, toggleSidebar }) => {
  const currentDate = new Date().toLocaleDateString('vi-VN');

  return (
    <header className="bg-white shadow-sm flex-shrink-0 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center overflow-hidden">
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 focus:outline-none mr-3 flex-shrink-0">
            <MenuIcon className="h-6 w-6" />
          </button>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-base sm:text-lg font-bold text-gray-700 ml-2 whitespace-nowrap">Version {APP_VERSION}</span>
          <span className="text-xs text-gray-400 italic">{currentDate}</span>
        </div>
      </div>
    </header>
  );
};
