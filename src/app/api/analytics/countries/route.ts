import { NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET() {
  try {
    const rows = await database.query(`
      SELECT country, COUNT(*) as count
      FROM users
      GROUP BY country
      ORDER BY count DESC
    `);

    const countryStats = rows.map((row: Record<string, unknown>) => ({
      country: row.country as string,
      count: row.count as number
    }));

    return NextResponse.json(countryStats);
  } catch (error) {
    console.error('Error fetching country stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch country statistics' },
      { status: 500 }
    );
  }
}
