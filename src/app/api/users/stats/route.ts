import { NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalUsersResult,
      activeUsersResult,
      newUsersTodayResult,
      totalBalanceResult,
      totalDepositsResult,
      totalWithdrawalsResult,
      pendingVerificationsResult,
      suspendedUsersResult
    ] = await Promise.all([
      database.query('SELECT COUNT(*) as count FROM users'),
      database.query('SELECT COUNT(*) as count FROM users WHERE status = "active"'),
      database.query('SELECT COUNT(*) as count FROM users WHERE DATE(registered_at) = ?', [today]),
      database.query('SELECT SUM(balance) as total FROM users'),
      database.query('SELECT SUM(total_deposited) as total FROM users'),
      database.query('SELECT SUM(total_withdrawn) as total FROM users'),
      database.query('SELECT COUNT(*) as count FROM users WHERE kyc_status = "pending"'),
      database.query('SELECT COUNT(*) as count FROM users WHERE status = "suspended"')
    ]);

    const stats = {
      totalUsers: (totalUsersResult[0] as Record<string, unknown>).count as number,
      activeUsers: (activeUsersResult[0] as Record<string, unknown>).count as number,
      newUsersToday: (newUsersTodayResult[0] as Record<string, unknown>).count as number,
      totalBalance: parseFloat(((totalBalanceResult[0] as Record<string, unknown>).total as string) || '0'),
      totalDeposits: parseFloat(((totalDepositsResult[0] as Record<string, unknown>).total as string) || '0'),
      totalWithdrawals: parseFloat(((totalWithdrawalsResult[0] as Record<string, unknown>).total as string) || '0'),
      pendingVerifications: (pendingVerificationsResult[0] as Record<string, unknown>).count as number,
      suspendedUsers: (suspendedUsersResult[0] as Record<string, unknown>).count as number,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}
