import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth, User } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  onMenuClick: () => void;
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, user }) => {
  const { t, language, setLanguage, availableLanguages } = useI18n();
  const { logout } = useAuth();
  const { theme, setTheme, availableThemes } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.15,
        ease: 'easeIn',
      },
    },
  };

  return (
    <header className="bg-secondary-800 border-b border-secondary-700 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-secondary-400 hover:text-white hover:bg-secondary-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Search bar */}
            <div className="hidden md:block ml-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t.common.search}
                  className="block w-full pl-10 pr-3 py-2 border border-secondary-600 rounded-md leading-5 bg-secondary-700 text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme selector */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 rounded-md text-secondary-400 hover:text-white hover:bg-secondary-700 transition-colors"
                title="テーマ切り替え"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>

              <AnimatePresence>
                {showThemeMenu && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 mt-2 w-48 bg-secondary-800 border border-secondary-700 rounded-md shadow-lg z-50"
                  >
                    <div className="py-1">
                      {availableThemes.map((themeOption) => (
                        <button
                          key={themeOption.value}
                          onClick={() => {
                            setTheme(themeOption.value);
                            setShowThemeMenu(false);
                          }}
                          className={clsx(
                            'block w-full text-left px-4 py-2 text-sm transition-colors',
                            theme === themeOption.value
                              ? 'bg-primary-500 text-white'
                              : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'
                          )}
                        >
                          {themeOption.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Language selector */}
            <div className="relative" ref={languageMenuRef}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="p-2 rounded-md text-secondary-400 hover:text-white hover:bg-secondary-700 transition-colors"
                title="言語切り替え"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </button>

              <AnimatePresence>
                {showLanguageMenu && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 mt-2 w-48 bg-secondary-800 border border-secondary-700 rounded-md shadow-lg z-50"
                  >
                    <div className="py-1">
                      {availableLanguages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setShowLanguageMenu(false);
                          }}
                          className={clsx(
                            'block w-full text-left px-4 py-2 text-sm transition-colors',
                            language === lang.code
                              ? 'bg-primary-500 text-white'
                              : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'
                          )}
                        >
                          <span className="font-medium">{lang.nativeName}</span>
                          <span className="ml-2 text-xs opacity-75">({lang.name})</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <button className="p-2 rounded-md text-secondary-400 hover:text-white hover:bg-secondary-700 transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v2.25a2.25 2.25 0 0 0 2.25 2.25H21a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5h2.25A2.25 2.25 0 0 0 7.5 12V9.75a6 6 0 0 1 6-6Z" />
              </svg>
              {/* Notification badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
            </button>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-md text-secondary-400 hover:text-white hover:bg-secondary-700 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium text-white">
                  {user?.displayName || user?.username}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 mt-2 w-48 bg-secondary-800 border border-secondary-700 rounded-md shadow-lg z-50"
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-secondary-700">
                        <p className="text-sm font-medium text-white">
                          {user?.displayName || user?.username}
                        </p>
                        <p className="text-xs text-secondary-400">
                          {user?.email}
                        </p>
                      </div>
                      
                      <button className="block w-full text-left px-4 py-2 text-sm text-secondary-300 hover:bg-secondary-700 hover:text-white transition-colors">
                        {t.settings.profile}
                      </button>
                      
                      <button className="block w-full text-left px-4 py-2 text-sm text-secondary-300 hover:bg-secondary-700 hover:text-white transition-colors">
                        {t.settings.preferences}
                      </button>
                      
                      <div className="border-t border-secondary-700">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-error-400 hover:bg-secondary-700 hover:text-error-300 transition-colors"
                        >
                          {t.auth.logout}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

