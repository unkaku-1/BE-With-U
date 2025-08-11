import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPage: React.FC = () => {
  const { t, language, setLanguage, availableLanguages } = useI18n();
  const { user, updateProfile } = useAuth();
  const { theme, setTheme, availableThemes } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  const [isLoading, setIsLoading] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
  });

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      await updateProfile(profileData);
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    {
      id: 'profile',
      name: t.settings.profile,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'preferences',
      name: t.settings.preferences,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      ),
    },
    {
      id: 'security',
      name: t.settings.security,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{t.settings.title}</h1>
        <p className="text-secondary-300 mt-1">
          アカウント設定とシステム環境設定
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="card p-6"
          >
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">{t.settings.profile}</h2>
                
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <button className="btn btn-secondary text-sm">
                      アバターを変更
                    </button>
                    <p className="text-xs text-secondary-400 mt-1">
                      JPG、PNG、GIF形式（最大2MB）
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      表示名
                    </label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      ユーザー名
                    </label>
                    <input
                      type="text"
                      value={user?.username || ''}
                      disabled
                      className="input w-full opacity-50 cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      役割
                    </label>
                    <input
                      type="text"
                      value={user?.role || ''}
                      disabled
                      className="input w-full opacity-50 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? '保存中...' : '変更を保存'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">{t.settings.preferences}</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-3">
                      {t.settings.language}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {availableLanguages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setLanguage(lang.code)}
                          className={`p-3 rounded-lg border transition-all ${
                            language === lang.code
                              ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                              : 'border-secondary-600 text-secondary-300 hover:border-secondary-500'
                          }`}
                        >
                          <div className="font-medium">{lang.nativeName}</div>
                          <div className="text-xs opacity-75">{lang.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-3">
                      {t.settings.theme}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {availableThemes.map((themeOption) => (
                        <button
                          key={themeOption.value}
                          onClick={() => setTheme(themeOption.value)}
                          className={`p-3 rounded-lg border transition-all ${
                            theme === themeOption.value
                              ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                              : 'border-secondary-600 text-secondary-300 hover:border-secondary-500'
                          }`}
                        >
                          {themeOption.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-3">
                      {t.settings.notifications}
                    </label>
                    <div className="space-y-3">
                      {[
                        { id: 'email', label: 'メール通知', description: '新しいチケットやメッセージの通知をメールで受信' },
                        { id: 'push', label: 'プッシュ通知', description: 'ブラウザでのプッシュ通知を有効にする' },
                        { id: 'sound', label: '音声通知', description: '通知音を再生する' },
                      ].map((notification) => (
                        <div key={notification.id} className="flex items-center justify-between p-3 border border-secondary-600 rounded-lg">
                          <div>
                            <div className="font-medium text-white">{notification.label}</div>
                            <div className="text-sm text-secondary-400">{notification.description}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">{t.settings.security}</h2>
                
                <div className="space-y-6">
                  <div className="p-4 border border-secondary-600 rounded-lg">
                    <h3 className="font-medium text-white mb-2">パスワード変更</h3>
                    <p className="text-sm text-secondary-400 mb-4">
                      定期的なパスワード変更をお勧めします
                    </p>
                    <button className="btn btn-secondary">
                      パスワードを変更
                    </button>
                  </div>

                  <div className="p-4 border border-secondary-600 rounded-lg">
                    <h3 className="font-medium text-white mb-2">二段階認証</h3>
                    <p className="text-sm text-secondary-400 mb-4">
                      アカウントのセキュリティを強化するために二段階認証を有効にしてください
                    </p>
                    <button className="btn btn-primary">
                      二段階認証を設定
                    </button>
                  </div>

                  <div className="p-4 border border-secondary-600 rounded-lg">
                    <h3 className="font-medium text-white mb-2">ログイン履歴</h3>
                    <p className="text-sm text-secondary-400 mb-4">
                      最近のログイン活動を確認できます
                    </p>
                    <button className="btn btn-ghost">
                      履歴を表示
                    </button>
                  </div>

                  <div className="p-4 border border-error-500/20 bg-error-500/5 rounded-lg">
                    <h3 className="font-medium text-error-400 mb-2">アカウント削除</h3>
                    <p className="text-sm text-secondary-400 mb-4">
                      アカウントを削除すると、すべてのデータが永久に失われます
                    </p>
                    <button className="btn btn-danger">
                      アカウントを削除
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

