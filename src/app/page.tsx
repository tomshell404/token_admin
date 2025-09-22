"use client";

import { useState, useEffect } from 'react';
import { AdminProvider, useAdmin } from '@/components/AdminProvider';
import LoginPage from '@/components/LoginPage';
import AdminDashboard from '@/components/AdminDashboard';

function AppContent() {
  const { currentAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentAdmin) {
    return <LoginPage />;
  }

  return <AdminDashboard />;
}

export default function Home() {
  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  );
}
