import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../contexts/I18nContext';

const TicketsPage: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');

  // Mock data
  const tickets = [
    {
      id: 'T-001',
      title: 'ネットワーク接続の問題',
      description: 'オフィスのWi-Fiに接続できません',
      status: 'open',
      priority: 'high',
      assignee: 'サポートチーム',
      created: '2024-01-15T10:30:00Z',
      updated: '2024-01-15T14:20:00Z',
    },
    {
      id: 'T-002',
      title: 'プリンター設定のサポート',
      description: '新しいプリンターの設定方法を教えてください',
      status: 'pending',
      priority: 'normal',
      assignee: '田中',
      created: '2024-01-14T09:15:00Z',
      updated: '2024-01-15T11:45:00Z',
    },
    {
      id: 'T-003',
      title: 'ソフトウェアライセンスの更新',
      description: 'Microsoft Officeのライセンスが期限切れです',
      status: 'resolved',
      priority: 'normal',
      assignee: '佐藤',
      created: '2024-01-13T16:00:00Z',
      updated: '2024-01-14T10:30:00Z',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-error-500';
      case 'pending': return 'bg-warning-500';
      case 'resolved': return 'bg-success-500';
      default: return 'bg-secondary-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-error-400';
      case 'high': return 'text-warning-400';
      case 'normal': return 'text-secondary-400';
      case 'low': return 'text-success-400';
      default: return 'text-secondary-400';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'all') return true;
    return ticket.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t.tickets.title}</h1>
          <p className="text-secondary-300 mt-1">
            サポートチケットの管理と追跡
          </p>
        </div>
        <button className="btn btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t.tickets.create}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'すべて', count: tickets.length },
            { key: 'open', label: t.tickets.open, count: tickets.filter(t => t.status === 'open').length },
            { key: 'pending', label: t.tickets.pending, count: tickets.filter(t => t.status === 'pending').length },
            { key: 'resolved', label: t.tickets.resolved, count: tickets.filter(t => t.status === 'resolved').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-secondary-400 hover:text-secondary-300 hover:border-secondary-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-secondary-700 text-secondary-300 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tickets list */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 card-hover cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-white">
                    {ticket.title}
                  </h3>
                  <span className="text-sm text-secondary-400">
                    #{ticket.id}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(ticket.status)}`} />
                </div>
                
                <p className="text-secondary-300 mb-3">
                  {ticket.description}
                </p>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="text-secondary-400">{t.tickets.status}:</span>
                    <span className="text-white capitalize">{ticket.status}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-secondary-400">{t.tickets.priority}:</span>
                    <span className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-secondary-400">{t.tickets.assignee}:</span>
                    <span className="text-white">{ticket.assignee}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right text-sm text-secondary-400">
                <div>作成: {new Date(ticket.created).toLocaleDateString('ja-JP')}</div>
                <div>更新: {new Date(ticket.updated).toLocaleDateString('ja-JP')}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-secondary-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-secondary-400">
            該当するチケットがありません
          </p>
        </div>
      )}
    </div>
  );
};

export default TicketsPage;

