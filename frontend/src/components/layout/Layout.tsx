import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-secondary-900 flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-secondary-900/80 backdrop-blur-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="container-wide py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

