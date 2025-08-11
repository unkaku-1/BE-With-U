import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'support' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="認証を確認中..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (requiredRole) {
    const roleHierarchy = {
      user: 0,
      support: 1,
      admin: 2,
    };

    const userRoleLevel = roleHierarchy[user.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen bg-secondary-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-error-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-7V6a3 3 0 00-6 0v1.5M9 9h6v6H9V9z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              アクセス権限がありません
            </h1>
            <p className="text-secondary-300 mb-4">
              このページにアクセスするには{requiredRole}権限が必要です。
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

