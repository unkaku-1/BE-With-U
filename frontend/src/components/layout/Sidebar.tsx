import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Navigation items
const navigationItems = [
  {
    name: 'dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
      </svg>
    ),
  },
  {
    name: 'chat',
    href: '/chat',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    name: 'tickets',
    href: '/tickets',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    name: 'knowledge',
    href: '/knowledge',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    name: 'settings',
    href: '/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const location = useLocation();

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-secondary-800 border-r border-secondary-700 pt-5 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BE</span>
                </div>
                <span className="ml-3 text-xl font-bold text-white">
                  BEwithU
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200',
                      isActive
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'
                    )}
                  >
                    <span className={clsx(
                      'mr-3 flex-shrink-0',
                      isActive ? 'text-white' : 'text-secondary-400 group-hover:text-white'
                    )}>
                      {item.icon}
                    </span>
                    {t.nav[item.name as keyof typeof t.nav]}
                  </NavLink>
                );
              })}
            </nav>

            {/* User info */}
            <div className="flex-shrink-0 flex border-t border-secondary-700 p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user?.displayName || user?.username}
                  </p>
                  <p className="text-xs text-secondary-400">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <motion.div
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-secondary-800 border-r border-secondary-700"
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BE</span>
              </div>
              <span className="ml-3 text-xl font-bold text-white">
                BEwithU
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={clsx(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200',
                    isActive
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'
                  )}
                >
                  <span className={clsx(
                    'mr-3 flex-shrink-0',
                    isActive ? 'text-white' : 'text-secondary-400 group-hover:text-white'
                  )}>
                    {item.icon}
                  </span>
                  {t.nav[item.name as keyof typeof t.nav]}
                </NavLink>
              );
            })}
          </nav>

          {/* User info */}
          <div className="flex-shrink-0 flex border-t border-secondary-700 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {user?.displayName || user?.username}
                </p>
                <p className="text-xs text-secondary-400">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;

