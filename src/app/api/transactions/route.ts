import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId');

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (userId) {
      whereClause += ' AND user_id = ?';
      params.push(userId);
    }

    const status = searchParams.get('status');
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    const type = searchParams.get('type');
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM transactions ${whereClause}`;
    const totalResult = await database.query(countQuery, params);
    const total = (totalResult[0] as Record<string, unknown>).total as number;

    // Get paginated transactions
    const offset = (page - 1) * limit;
    const query = `
      SELECT *, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') as createdAt,
             DATE_FORMAT(completed_at, '%Y-%m-%dT%H:%i:%s.000Z') as completedAt
      FROM transactions
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const rows = await database.query(query, params);

    const transactions = rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      userId: row.user_id as string,
      type: row.type as string,
      amount: parseFloat(row.amount as string),
      currency: row.currency as string,
      status: row.status as string,
      txHash: row.tx_hash as string | undefined,
      description: row.description as string,
      createdAt: row.createdAt as string,
      completedAt: row.completedAt as string | undefined,
      adminNotes: row.admin_notes as string | undefined
    }));

    return NextResponse.json({ transactions, total });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
