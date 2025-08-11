import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';

import App from './App';
import { I18nProvider } from './contexts/I18nContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import './styles/index.css';

// React Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-secondary-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-secondary-800 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-error-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              エラーが発生しました
            </h1>
            <p className="text-secondary-300 mb-4">
              申し訳ございません。予期しないエラーが発生しました。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Root component
const Root: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                <App />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#1e293b',
                      color: '#f1f5f9',
                      border: '1px solid #334155',
                    },
                    success: {
                      iconTheme: {
                        primary: '#22c55e',
                        secondary: '#f1f5f9',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#f1f5f9',
                      },
                    },
                  }}
                />
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </BrowserRouter>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<Root />);
} else {
  console.error('Root container not found');
}

