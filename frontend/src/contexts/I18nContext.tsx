import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported languages
export type Language = 'ja' | 'zh' | 'en';

// Translation keys interface
export interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    create: string;
    search: string;
    filter: string;
    sort: string;
    refresh: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    open: string;
    yes: string;
    no: string;
  };
  
  // Navigation
  nav: {
    dashboard: string;
    chat: string;
    tickets: string;
    knowledge: string;
    settings: string;
    logout: string;
  };
  
  // Authentication
  auth: {
    login: string;
    logout: string;
    username: string;
    password: string;
    forgotPassword: string;
    rememberMe: string;
    loginError: string;
    loginSuccess: string;
  };
  
  // Chat
  chat: {
    title: string;
    placeholder: string;
    send: string;
    typing: string;
    newChat: string;
    clearHistory: string;
    exportChat: string;
    noMessages: string;
    errorSending: string;
  };
  
  // Tickets
  tickets: {
    title: string;
    create: string;
    status: string;
    priority: string;
    assignee: string;
    created: string;
    updated: string;
    description: string;
    comments: string;
    addComment: string;
    open: string;
    pending: string;
    resolved: string;
    closed: string;
    low: string;
    normal: string;
    high: string;
    urgent: string;
  };
  
  // Knowledge Base
  knowledge: {
    title: string;
    search: string;
    categories: string;
    articles: string;
    createArticle: string;
    editArticle: string;
    deleteArticle: string;
    published: string;
    draft: string;
    tags: string;
    lastUpdated: string;
    author: string;
  };
  
  // Settings
  settings: {
    title: string;
    profile: string;
    preferences: string;
    language: string;
    theme: string;
    notifications: string;
    privacy: string;
    security: string;
    about: string;
  };
  
  // Dashboard
  dashboard: {
    title: string;
    welcome: string;
    recentChats: string;
    openTickets: string;
    knowledgeStats: string;
    systemStatus: string;
    quickActions: string;
  };
  
  // Errors
  errors: {
    networkError: string;
    serverError: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    validationError: string;
    unknownError: string;
  };
}

// Translation data
const translations: Record<Language, Translations> = {
  ja: {
    common: {
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      cancel: 'キャンセル',
      confirm: '確認',
      save: '保存',
      delete: '削除',
      edit: '編集',
      create: '作成',
      search: '検索',
      filter: 'フィルター',
      sort: '並び替え',
      refresh: '更新',
      back: '戻る',
      next: '次へ',
      previous: '前へ',
      close: '閉じる',
      open: '開く',
      yes: 'はい',
      no: 'いいえ',
    },
    nav: {
      dashboard: 'ダッシュボード',
      chat: 'チャット',
      tickets: 'チケット',
      knowledge: 'ナレッジベース',
      settings: '設定',
      logout: 'ログアウト',
    },
    auth: {
      login: 'ログイン',
      logout: 'ログアウト',
      username: 'ユーザー名',
      password: 'パスワード',
      forgotPassword: 'パスワードを忘れた方',
      rememberMe: 'ログイン状態を保持',
      loginError: 'ログインに失敗しました',
      loginSuccess: 'ログインしました',
    },
    chat: {
      title: 'AI チャット',
      placeholder: 'メッセージを入力してください...',
      send: '送信',
      typing: '入力中...',
      newChat: '新しいチャット',
      clearHistory: '履歴をクリア',
      exportChat: 'チャットをエクスポート',
      noMessages: 'メッセージがありません',
      errorSending: 'メッセージの送信に失敗しました',
    },
    tickets: {
      title: 'チケット管理',
      create: 'チケット作成',
      status: 'ステータス',
      priority: '優先度',
      assignee: '担当者',
      created: '作成日',
      updated: '更新日',
      description: '説明',
      comments: 'コメント',
      addComment: 'コメント追加',
      open: 'オープン',
      pending: '保留中',
      resolved: '解決済み',
      closed: 'クローズ',
      low: '低',
      normal: '通常',
      high: '高',
      urgent: '緊急',
    },
    knowledge: {
      title: 'ナレッジベース',
      search: '記事を検索',
      categories: 'カテゴリー',
      articles: '記事',
      createArticle: '記事作成',
      editArticle: '記事編集',
      deleteArticle: '記事削除',
      published: '公開済み',
      draft: '下書き',
      tags: 'タグ',
      lastUpdated: '最終更新',
      author: '作成者',
    },
    settings: {
      title: '設定',
      profile: 'プロフィール',
      preferences: '設定',
      language: '言語',
      theme: 'テーマ',
      notifications: '通知',
      privacy: 'プライバシー',
      security: 'セキュリティ',
      about: 'このアプリについて',
    },
    dashboard: {
      title: 'ダッシュボード',
      welcome: 'おかえりなさい',
      recentChats: '最近のチャット',
      openTickets: 'オープンチケット',
      knowledgeStats: 'ナレッジ統計',
      systemStatus: 'システム状態',
      quickActions: 'クイックアクション',
    },
    errors: {
      networkError: 'ネットワークエラーが発生しました',
      serverError: 'サーバーエラーが発生しました',
      notFound: 'ページが見つかりません',
      unauthorized: '認証が必要です',
      forbidden: 'アクセスが拒否されました',
      validationError: '入力内容に誤りがあります',
      unknownError: '不明なエラーが発生しました',
    },
  },
  zh: {
    common: {
      loading: '加载中...',
      error: '错误',
      success: '成功',
      cancel: '取消',
      confirm: '确认',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      create: '创建',
      search: '搜索',
      filter: '筛选',
      sort: '排序',
      refresh: '刷新',
      back: '返回',
      next: '下一步',
      previous: '上一步',
      close: '关闭',
      open: '打开',
      yes: '是',
      no: '否',
    },
    nav: {
      dashboard: '仪表板',
      chat: '聊天',
      tickets: '工单',
      knowledge: '知识库',
      settings: '设置',
      logout: '退出登录',
    },
    auth: {
      login: '登录',
      logout: '退出登录',
      username: '用户名',
      password: '密码',
      forgotPassword: '忘记密码',
      rememberMe: '记住我',
      loginError: '登录失败',
      loginSuccess: '登录成功',
    },
    chat: {
      title: 'AI 聊天',
      placeholder: '请输入消息...',
      send: '发送',
      typing: '正在输入...',
      newChat: '新建聊天',
      clearHistory: '清除历史',
      exportChat: '导出聊天',
      noMessages: '暂无消息',
      errorSending: '消息发送失败',
    },
    tickets: {
      title: '工单管理',
      create: '创建工单',
      status: '状态',
      priority: '优先级',
      assignee: '负责人',
      created: '创建时间',
      updated: '更新时间',
      description: '描述',
      comments: '评论',
      addComment: '添加评论',
      open: '开放',
      pending: '待处理',
      resolved: '已解决',
      closed: '已关闭',
      low: '低',
      normal: '普通',
      high: '高',
      urgent: '紧急',
    },
    knowledge: {
      title: '知识库',
      search: '搜索文章',
      categories: '分类',
      articles: '文章',
      createArticle: '创建文章',
      editArticle: '编辑文章',
      deleteArticle: '删除文章',
      published: '已发布',
      draft: '草稿',
      tags: '标签',
      lastUpdated: '最后更新',
      author: '作者',
    },
    settings: {
      title: '设置',
      profile: '个人资料',
      preferences: '偏好设置',
      language: '语言',
      theme: '主题',
      notifications: '通知',
      privacy: '隐私',
      security: '安全',
      about: '关于',
    },
    dashboard: {
      title: '仪表板',
      welcome: '欢迎回来',
      recentChats: '最近聊天',
      openTickets: '开放工单',
      knowledgeStats: '知识统计',
      systemStatus: '系统状态',
      quickActions: '快速操作',
    },
    errors: {
      networkError: '网络错误',
      serverError: '服务器错误',
      notFound: '页面未找到',
      unauthorized: '需要认证',
      forbidden: '访问被拒绝',
      validationError: '输入验证错误',
      unknownError: '未知错误',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      refresh: 'Refresh',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      open: 'Open',
      yes: 'Yes',
      no: 'No',
    },
    nav: {
      dashboard: 'Dashboard',
      chat: 'Chat',
      tickets: 'Tickets',
      knowledge: 'Knowledge Base',
      settings: 'Settings',
      logout: 'Logout',
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      username: 'Username',
      password: 'Password',
      forgotPassword: 'Forgot Password',
      rememberMe: 'Remember Me',
      loginError: 'Login failed',
      loginSuccess: 'Login successful',
    },
    chat: {
      title: 'AI Chat',
      placeholder: 'Type your message...',
      send: 'Send',
      typing: 'Typing...',
      newChat: 'New Chat',
      clearHistory: 'Clear History',
      exportChat: 'Export Chat',
      noMessages: 'No messages',
      errorSending: 'Failed to send message',
    },
    tickets: {
      title: 'Ticket Management',
      create: 'Create Ticket',
      status: 'Status',
      priority: 'Priority',
      assignee: 'Assignee',
      created: 'Created',
      updated: 'Updated',
      description: 'Description',
      comments: 'Comments',
      addComment: 'Add Comment',
      open: 'Open',
      pending: 'Pending',
      resolved: 'Resolved',
      closed: 'Closed',
      low: 'Low',
      normal: 'Normal',
      high: 'High',
      urgent: 'Urgent',
    },
    knowledge: {
      title: 'Knowledge Base',
      search: 'Search articles',
      categories: 'Categories',
      articles: 'Articles',
      createArticle: 'Create Article',
      editArticle: 'Edit Article',
      deleteArticle: 'Delete Article',
      published: 'Published',
      draft: 'Draft',
      tags: 'Tags',
      lastUpdated: 'Last Updated',
      author: 'Author',
    },
    settings: {
      title: 'Settings',
      profile: 'Profile',
      preferences: 'Preferences',
      language: 'Language',
      theme: 'Theme',
      notifications: 'Notifications',
      privacy: 'Privacy',
      security: 'Security',
      about: 'About',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome back',
      recentChats: 'Recent Chats',
      openTickets: 'Open Tickets',
      knowledgeStats: 'Knowledge Stats',
      systemStatus: 'System Status',
      quickActions: 'Quick Actions',
    },
    errors: {
      networkError: 'Network error occurred',
      serverError: 'Server error occurred',
      notFound: 'Page not found',
      unauthorized: 'Authentication required',
      forbidden: 'Access denied',
      validationError: 'Validation error',
      unknownError: 'Unknown error occurred',
    },
  },
};

// Context interface
interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
  availableLanguages: { code: Language; name: string; nativeName: string }[];
}

// Available languages
const availableLanguages = [
  { code: 'ja' as Language, name: 'Japanese', nativeName: '日本語' },
  { code: 'zh' as Language, name: 'Chinese', nativeName: '中文' },
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
];

// Create context
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Provider component
interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or browser preference
    const saved = localStorage.getItem('bewithU-language') as Language;
    if (saved && availableLanguages.some(lang => lang.code === saved)) {
      return saved;
    }
    
    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('zh')) return 'zh';
    return 'en';
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('bewithU-language', newLanguage);
    document.documentElement.lang = newLanguage;
  };

  // Update document language on mount
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language],
    availableLanguages,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook to use i18n
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

