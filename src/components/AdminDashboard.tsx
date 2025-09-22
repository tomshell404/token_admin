"use client";

import { useState } from 'react';
import { useAdmin } from './AdminProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Import page components
import DashboardHome from './DashboardHome';
import UserManagement from './UserManagement';
import ChatManagement from './ChatManagement';
import TransactionManagement from './TransactionManagement';
import Analytics from './Analytics';
import Settings from './Settings';

type Page = 'dashboard' | 'users' | 'chat' | 'transactions' | 'analytics' | 'settings';

const navigation = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'chat', label: 'Live Chat', icon: '💬' },
  { key: 'transactions', label: 'Transactions', icon: '💰' },
  { key: 'analytics', label: 'Analytics', icon: '📈' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminDashboard() {
  const { currentAdmin, logout, updateAdminStatus } = useAdmin();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome />;
      case 'users':
        return <UserManagement />;
      case 'chat':
        return <ChatManagement />;
      case 'transactions':
        return <TransactionManagement />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardHome />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">TT</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Token Trade</h1>
              <p className="text-sm text-gray-500">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.key as Page)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                currentPage === item.key
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {item.key === 'chat' && (
                <Badge variant="secondary" className="ml-auto bg-red-100 text-red-600">
                  3
                </Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Admin Info */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                    {currentAdmin?.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(currentAdmin?.status || 'offline')}`}></div>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{currentAdmin?.name}</p>
                <p className="text-gray-500 capitalize">{currentAdmin?.role}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="text-gray-400">⋮</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => updateAdminStatus('online')}>
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Online
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateAdminStatus('away')}>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  Away
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateAdminStatus('offline')}>
                  <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                  Offline
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  🚪 Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {currentPage === 'dashboard' ? 'Dashboard' : navigation.find(n => n.key === currentPage)?.label}
              </h2>
              <p className="text-gray-600 text-sm">
                {currentPage === 'dashboard' && 'Overview of your Token Trade platform'}
                {currentPage === 'users' && 'Manage user accounts and verification'}
                {currentPage === 'chat' && 'Live customer support conversations'}
                {currentPage === 'transactions' && 'Monitor deposits, withdrawals, and trades'}
                {currentPage === 'analytics' && 'Platform analytics and insights'}
                {currentPage === 'settings' && 'System configuration and preferences'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(currentAdmin?.status || 'offline')}`}></div>
                <span className="capitalize">{currentAdmin?.status}</span>
              </div>

              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Platform Online
              </Badge>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
