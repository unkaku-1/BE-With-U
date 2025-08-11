import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  // Mock data for demonstration
  const stats = [
    {
      title: t.dashboard.recentChats,
      value: '12',
      change: '+2',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      title: t.dashboard.openTickets,
      value: '5',
      change: '-1',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
    {
      title: t.dashboard.knowledgeStats,
      value: '248',
      change: '+15',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      title: t.dashboard.systemStatus,
      value: '99.9%',
      change: '0%',
      changeType: 'neutral' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const quickActions = [
    {
      title: t.chat.newChat,
      description: 'AIアシスタントと新しい会話を開始',
      href: '/chat',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'bg-primary-500',
    },
    {
      title: t.tickets.create,
      description: '新しいサポートチケットを作成',
      href: '/tickets',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      color: 'bg-success-500',
    },
    {
      title: t.knowledge.search,
      description: 'ナレッジベースを検索',
      href: '/knowledge',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'bg-warning-500',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'chat',
      title: 'ネットワーク接続の問題について相談',
      time: '2分前',
      status: 'completed',
    },
    {
      id: 2,
      type: 'ticket',
      title: 'プリンター設定のサポート要請',
      time: '15分前',
      status: 'pending',
    },
    {
      id: 3,
      type: 'knowledge',
      title: 'VPN設定ガイドを更新',
      time: '1時間前',
      status: 'completed',
    },
    {
      id: 4,
      type: 'chat',
      title: 'ソフトウェアインストールの手順確認',
      time: '2時間前',
      status: 'completed',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome section */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {t.dashboard.welcome}, {user?.displayName || user?.username}!
        </h1>
        <p className="text-secondary-300">
          今日も一日お疲れ様です。システムの状況をご確認ください。
        </p>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            className="card p-6 card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-white">
                  {stat.value}
                </p>
                <div className="flex items-center mt-2">
                  <span className={`text-xs font-medium ${
                    stat.changeType === 'positive' ? 'text-success-400' :
                    stat.changeType === 'negative' ? 'text-error-400' :
                    'text-secondary-400'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-secondary-500 ml-1">
                    前日比
                  </span>
                </div>
              </div>
              <div className="text-primary-400">
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              {t.dashboard.quickActions}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={action.title}
                  to={action.href}
                  className="group block"
                >
                  <motion.div
                    variants={itemVariants}
                    className="p-4 rounded-lg border border-secondary-600 hover:border-secondary-500 transition-all duration-200 hover:shadow-medium"
                  >
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 text-white group-hover:scale-110 transition-transform duration-200`}>
                      {action.icon}
                    </div>
                    <h3 className="font-medium text-white mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-secondary-400">
                      {action.description}
                    </p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent activities */}
        <motion.div variants={itemVariants}>
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              最近のアクティビティ
            </h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'completed' ? 'bg-success-500' :
                    activity.status === 'pending' ? 'bg-warning-500' :
                    'bg-secondary-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-secondary-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-sm text-primary-400 hover:text-primary-300 transition-colors">
              すべて表示
            </button>
          </div>
        </motion.div>
      </div>

      {/* System status */}
      <motion.div variants={itemVariants}>
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {t.dashboard.systemStatus}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-white">API サーバー</p>
                <p className="text-xs text-secondary-400">正常稼働中</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-white">データベース</p>
                <p className="text-xs text-secondary-400">正常稼働中</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-white">LLM サービス</p>
                <p className="text-xs text-secondary-400">正常稼働中</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;

