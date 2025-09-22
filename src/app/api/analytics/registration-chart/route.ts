import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const rows = await database.query(`
      SELECT DATE(registered_at) as date, COUNT(*) as count
      FROM users
      WHERE registered_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(registered_at)
      ORDER BY date ASC
    `, [days]);

    // Fill in missing dates with 0 count
    const chart = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const found = rows.find((row: Record<string, unknown>) => row.date === dateString);
      chart.push({
        date: dateString,
        count: found ? found.count : 0
      });
    }

    return NextResponse.json(chart);
  } catch (error) {
    console.error('Error fetching registration chart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration chart data' },
      { status: 500 }
    );
  }
}
