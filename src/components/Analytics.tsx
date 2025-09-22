"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { userService, UserStats } from '@/services/userService';
import { chatService } from '@/services/chatService';

interface ChartDataPoint {
  date: string;
  count: number;
}

interface CountryStatistic {
  country: string;
  count: number;
}

interface ResponseTimeChart {
  date: string;
  avgTime: number;
}

export default function Analytics() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [registrationChart, setRegistrationChart] = useState<ChartDataPoint[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStatistic[]>([]);
  const [responseTimeChart, setResponseTimeChart] = useState<ResponseTimeChart[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const stats = await userService.getUserStats();
      setUserStats(stats);

      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      const regChart = await userService.getRegistrationChart(days);
      setRegistrationChart(regChart);

      const countries = await userService.getCountryStats();
      setCountryStats(countries.slice(0, 10));

      const responseChart = chatService.getResponseTimeChart(days);
      setResponseTimeChart(responseChart);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">{userStats.totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold">{userStats.activeUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500">Total Balance</p>
              <p className="text-2xl font-bold">${userStats.totalBalance.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500">New Users Today</p>
              <p className="text-2xl font-bold">{userStats.newUsersToday}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
