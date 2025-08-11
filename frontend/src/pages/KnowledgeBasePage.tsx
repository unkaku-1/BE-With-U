import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../contexts/I18nContext';

const KnowledgeBasePage: React.FC = () => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock data
  const categories = [
    { id: 'all', name: 'すべて', count: 15 },
    { id: 'network', name: 'ネットワーク', count: 5 },
    { id: 'software', name: 'ソフトウェア', count: 4 },
    { id: 'hardware', name: 'ハードウェア', count: 3 },
    { id: 'security', name: 'セキュリティ', count: 3 },
  ];

  const articles = [
    {
      id: '1',
      title: 'Wi-Fi接続のトラブルシューティング',
      summary: 'オフィスのWi-Fiに接続できない場合の対処法について説明します。',
      category: 'network',
      tags: ['Wi-Fi', 'ネットワーク', 'トラブルシューティング'],
      author: '田中太郎',
      lastUpdated: '2024-01-15T10:30:00Z',
      views: 245,
      status: 'published',
    },
    {
      id: '2',
      title: 'Microsoft Office のライセンス管理',
      summary: 'Officeライセンスの確認方法と更新手順について詳しく解説します。',
      category: 'software',
      tags: ['Office', 'ライセンス', 'Microsoft'],
      author: '佐藤花子',
      lastUpdated: '2024-01-14T15:20:00Z',
      views: 189,
      status: 'published',
    },
    {
      id: '3',
      title: 'プリンター設定ガイド',
      summary: '新しいプリンターの設定方法とよくある問題の解決策をまとめました。',
      category: 'hardware',
      tags: ['プリンター', '設定', 'ハードウェア'],
      author: '山田次郎',
      lastUpdated: '2024-01-13T09:45:00Z',
      views: 156,
      status: 'published',
    },
    {
      id: '4',
      title: 'VPN接続の設定手順',
      summary: 'リモートワーク時のVPN接続設定について詳しく説明します。',
      category: 'network',
      tags: ['VPN', 'リモートワーク', 'セキュリティ'],
      author: '鈴木一郎',
      lastUpdated: '2024-01-12T14:10:00Z',
      views: 298,
      status: 'published',
    },
    {
      id: '5',
      title: 'パスワード管理のベストプラクティス',
      summary: '安全なパスワードの作成と管理方法について解説します。',
      category: 'security',
      tags: ['パスワード', 'セキュリティ', 'ベストプラクティス'],
      author: '高橋美咲',
      lastUpdated: '2024-01-11T11:30:00Z',
      views: 203,
      status: 'published',
    },
  ];

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t.knowledge.title}</h1>
          <p className="text-secondary-300 mt-1">
            技術情報とソリューションのデータベース
          </p>
        </div>
        <button className="btn btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t.knowledge.createArticle}
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t.knowledge.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-secondary-600 rounded-lg leading-5 bg-secondary-800 text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <h3 className="text-lg font-medium text-white mb-4">{t.knowledge.categories}</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary-500 text-white'
                      : 'text-secondary-300 hover:bg-secondary-700 hover:text-white'
                  }`}
                >
                  <span>{category.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedCategory === category.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-secondary-600 text-secondary-300'
                  }`}>
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Articles list */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 card-hover cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-medium text-white hover:text-primary-400 transition-colors">
                    {article.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-secondary-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{article.views}</span>
                  </div>
                </div>
                
                <p className="text-secondary-300 mb-4">
                  {article.summary}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-secondary-700 text-secondary-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-secondary-400">
                  <div className="flex items-center space-x-4">
                    <span>作成者: {article.author}</span>
                    <span>更新: {new Date(article.lastUpdated).toLocaleDateString('ja-JP')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                    <span>{article.status}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-secondary-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-secondary-400">
                検索条件に一致する記事が見つかりません
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBasePage;

