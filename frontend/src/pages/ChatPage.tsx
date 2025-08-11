import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'system';
  timestamp: Date;
  isTyping?: boolean;
}

const ChatPage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'こんにちは！BEwithU AIアシスタントです。何かお困りのことがございましたら、お気軽にお聞かせください。',
      type: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle input resize
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      type: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock AI response
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateMockResponse(userMessage.content),
        type: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '申し訳ございません。エラーが発生しました。もう一度お試しください。',
        type: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const generateMockResponse = (userInput: string): string => {
    const responses = [
      'ご質問ありがとうございます。詳しく調べてお答えいたします。',
      'その件について、知識ベースを検索しています...',
      'こちらの情報が参考になるかもしれません。',
      'もう少し詳しく教えていただけますか？',
      'この問題については、サポートチケットを作成することをお勧めします。',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        content: 'チャット履歴がクリアされました。新しい会話を開始してください。',
        type: 'system',
        timestamp: new Date(),
      },
    ]);
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-700">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.chat.title}</h1>
          <p className="text-sm text-secondary-400">
            AIアシスタントがサポートいたします
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={clearChat}
            className="btn btn-ghost text-sm"
            title={t.chat.clearHistory}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t.chat.clearHistory}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xs lg:max-w-md ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 ${
                  message.type === 'user' ? 'ml-3' : 'mr-3'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-primary-500' 
                      : message.type === 'assistant'
                      ? 'bg-secondary-600'
                      : 'bg-warning-500'
                  }`}>
                    {message.type === 'user' ? (
                      <span className="text-white text-sm font-medium">
                        {user?.displayName?.charAt(0) || 'U'}
                      </span>
                    ) : message.type === 'assistant' ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Message bubble */}
                <div className={`px-4 py-2 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-primary-500 text-white rounded-br-md'
                    : message.type === 'assistant'
                    ? 'bg-secondary-700 text-secondary-100 rounded-bl-md'
                    : 'bg-warning-500/20 text-warning-200 border border-warning-500/30'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' 
                      ? 'text-primary-100' 
                      : 'text-secondary-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-start"
          >
            <div className="flex mr-3">
              <div className="w-8 h-8 bg-secondary-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="bg-secondary-700 px-4 py-2 rounded-2xl rounded-bl-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-secondary-700 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t.chat.placeholder}
              className="w-full px-4 py-3 bg-secondary-800 border border-secondary-600 rounded-lg text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-32"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="btn btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-secondary-500 mt-2">
          Shift + Enter で改行、Enter で送信
        </p>
      </div>
    </div>
  );
};

export default ChatPage;

