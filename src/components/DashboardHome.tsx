"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { userService, UserStats, User, Transaction } from '@/services/userService';
import { chatService, ChatStats } from '@/services/chatService';

interface DashboardStats {
  users: UserStats;
  chat: ChatStats;
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
    growth: number;
  };
  platform: {
    uptime: number;
    activeUsers: number;
    totalTrades: number;
    successRate: number;
  };
}

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const userStats = await userService.getUserStats();
      const chatStats = chatService.getChatStats();

      // Mock revenue data
      const revenue = {
        total: 1234567.89,
        today: 15432.10,
        thisMonth: 234567.89,
        growth: 12.5,
      };

      // Mock platform data
      const platform = {
        uptime: 99.98,
        activeUsers: userStats.activeUsers,
        totalTrades: 15678,
        successRate: 98.7,
      };

      setStats({
        users: userStats,
        chat: chatStats,
        revenue,
        platform,
      });

      // Load recent users
      const { users } = await userService.getUsers({}, 1, 5);
      setRecentUsers(users);

      // Load pending transactions
      const { transactions } = await userService.getAllTransactions({ status: 'pending' }, 1, 5);
      setPendingTransactions(transactions);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.users.totalUsers)}</p>
                <p className="text-sm text-green-600">+{stats.users.newUsersToday} today</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.users.totalBalance)}</p>
                <p className="text-sm text-blue-600">{stats.users.activeUsers} active users</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue Today</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue.today)}</p>
                <p className="text-sm text-green-600">+{stats.revenue.growth}% this month</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Chats</p>
                <p className="text-2xl font-bold text-gray-900">{stats.chat.activeConversations}</p>
                <p className="text-sm text-gray-600">{stats.chat.onlineAgents} agents online</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>👥</span>
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {user.fullName.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(user.balance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>⏳</span>
              Pending Transactions
              <Badge variant="secondary">{pendingTransactions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending transactions</p>
              ) : (
                pendingTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {transaction.type} - {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-500">{transaction.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {transaction.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats.platform.uptime}%
            </div>
            <p className="text-sm text-gray-600">System Uptime</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {formatNumber(stats.platform.totalTrades)}
            </div>
            <p className="text-sm text-gray-600">Total Trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {stats.platform.successRate}%
            </div>
            <p className="text-sm text-gray-600">Success Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {stats.users.pendingVerifications}
            </div>
            <p className="text-sm text-gray-600">Pending KYC</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center">
              <div className="text-2xl mb-2">👥</div>
              <p className="text-sm font-medium">Manage Users</p>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center">
              <div className="text-2xl mb-2">💬</div>
              <p className="text-sm font-medium">Live Chat</p>
            </button>
            <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-center">
              <div className="text-2xl mb-2">💰</div>
              <p className="text-sm font-medium">Transactions</p>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm font-medium">Analytics</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
