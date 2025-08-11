import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { t, language, setLanguage, availableLanguages } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ username, password, rememberMe });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.loginError);
    } finally {
      setIsLoading(false);
    }
  };

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const cardVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: 0.2,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        {/* Language selector */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-secondary-800/50 backdrop-blur-sm rounded-lg p-1">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                  language === lang.code
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-secondary-300 hover:text-white hover:bg-secondary-700'
                }`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          className="bg-secondary-800/80 backdrop-blur-md border border-secondary-700 rounded-2xl shadow-2xl p-8"
        >
          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-bold text-2xl">BE</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              BEwithU
            </h1>
            <p className="text-secondary-300 text-sm">
              {language === 'ja' && '智能IT支持系统'}
              {language === 'zh' && '智能IT支持系统'}
              {language === 'en' && 'Intelligent IT Support System'}
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-error-500/10 border border-error-500/20 rounded-lg p-3"
              >
                <p className="text-error-400 text-sm text-center">{error}</p>
              </motion.div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-secondary-300 mb-2">
                {t.auth.username}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input w-full"
                placeholder={t.auth.username}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-300 mb-2">
                {t.auth.password}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input w-full"
                placeholder={t.auth.password}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-secondary-600 rounded bg-secondary-700"
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-300">
                  {t.auth.rememberMe}
                </label>
              </div>

              <button
                type="button"
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                disabled={isLoading}
              >
                {t.auth.forgotPassword}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="btn btn-primary w-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" color="white" />
                  <span className="ml-2">{t.common.loading}</span>
                </div>
              ) : (
                t.auth.login
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-secondary-700/50 rounded-lg border border-secondary-600">
            <p className="text-xs text-secondary-400 text-center mb-2">
              {language === 'ja' && 'デモ用アカウント:'}
              {language === 'zh' && '演示账户:'}
              {language === 'en' && 'Demo Account:'}
            </p>
            <div className="text-xs text-secondary-300 text-center space-y-1">
              <div>
                {language === 'ja' && 'ユーザー名: admin'}
                {language === 'zh' && '用户名: admin'}
                {language === 'en' && 'Username: admin'}
              </div>
              <div>
                {language === 'ja' && 'パスワード: admin123'}
                {language === 'zh' && '密码: admin123'}
                {language === 'en' && 'Password: admin123'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-secondary-500">
            © 2024 BEwithU. All rights reserved.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;

