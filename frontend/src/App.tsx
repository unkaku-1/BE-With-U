import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Contexts
import { I18nProvider } from './contexts/I18nContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import TicketsPage from './pages/TicketsPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import SettingsPage from './pages/SettingsPage';

// Styles
import './styles/index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginPage />} />
                  
                  {/* Protected routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="chat" element={<ChatPage />} />
                    <Route path="tickets" element={<TicketsPage />} />
                    <Route path="knowledge" element={<KnowledgeBasePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>

                {/* Toast notifications */}
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
              </div>
            </Router>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

