import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build filters from query params
    const filters: Record<string, string | number | boolean> = {};
    const status = searchParams.get('status');
    if (status) filters.status = status;
    const verified = searchParams.get('verified');
    if (verified) filters.verified = verified === 'true';
    const kycStatus = searchParams.get('kycStatus');
    if (kycStatus) filters.kycStatus = kycStatus;
    const riskLevel = searchParams.get('riskLevel');
    if (riskLevel) filters.riskLevel = riskLevel;
    const country = searchParams.get('country');
    if (country) filters.country = country;
    const searchTerm = searchParams.get('searchTerm');
    if (searchTerm) filters.searchTerm = searchTerm;
    const minBalance = searchParams.get('minBalance');
    if (minBalance) filters.minBalance = parseFloat(minBalance);
    const maxBalance = searchParams.get('maxBalance');
    if (maxBalance) filters.maxBalance = parseFloat(maxBalance);
    const registeredAfter = searchParams.get('registeredAfter');
    if (registeredAfter) filters.registeredAfter = registeredAfter;
    const registeredBefore = searchParams.get('registeredBefore');
    if (registeredBefore) filters.registeredBefore = registeredBefore;

    let whereClause = 'WHERE 1=1';
    const params: (string | number | boolean)[] = [];

    // Build WHERE clause based on filters
    if (filters.status) {
      whereClause += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.verified !== undefined) {
      whereClause += ' AND verified = ?';
      params.push(filters.verified);
    }
    if (filters.kycStatus) {
      whereClause += ' AND kyc_status = ?';
      params.push(filters.kycStatus);
    }
    if (filters.riskLevel) {
      whereClause += ' AND risk_level = ?';
      params.push(filters.riskLevel);
    }
    if (filters.country) {
      whereClause += ' AND country LIKE ?';
      params.push(`%${filters.country}%`);
    }
    if (filters.searchTerm) {
      whereClause += ' AND (full_name LIKE ? OR email LIKE ? OR id LIKE ?)';
      const searchParam = `%${filters.searchTerm}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    if (filters.minBalance !== undefined) {
      whereClause += ' AND balance >= ?';
      params.push(filters.minBalance);
    }
    if (filters.maxBalance !== undefined) {
      whereClause += ' AND balance <= ?';
      params.push(filters.maxBalance);
    }
    if (filters.registeredAfter) {
      whereClause += ' AND registered_at >= ?';
      params.push(filters.registeredAfter);
    }
    if (filters.registeredBefore) {
      whereClause += ' AND registered_at <= ?';
      params.push(filters.registeredBefore);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const totalResult = await database.query(countQuery, params);
    const total = (totalResult[0] as Record<string, unknown>).total as number;

    // Get paginated users
    const offset = (page - 1) * limit;
    const query = `
      SELECT *, DATE_FORMAT(last_login, '%Y-%m-%dT%H:%i:%s.000Z') as lastLogin,
             DATE_FORMAT(registered_at, '%Y-%m-%dT%H:%i:%s.000Z') as registeredAt
      FROM users
      ${whereClause}
      ORDER BY registered_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const rows = await database.query(query, params);

    const users = await Promise.all(rows.map(async (row: Record<string, unknown>) => {
      // Get KYC documents for each user
      const kycDocs = await database.query(
        'SELECT id, type, url, DATE_FORMAT(uploaded_at, \'%Y-%m-%dT%H:%i:%s.000Z\') as uploadedAt FROM kyc_documents WHERE user_id = ?',
        [row.id as string]
      );

      return {
        id: row.id as string,
        email: row.email as string,
        fullName: row.full_name as string,
        phone: row.phone as string | undefined,
        country: row.country as string,
        status: row.status as string,
        verified: Boolean(row.verified),
        balance: parseFloat(row.balance as string),
        totalDeposited: parseFloat(row.total_deposited as string),
        totalWithdrawn: parseFloat(row.total_withdrawn as string),
        totalProfit: parseFloat(row.total_profit as string),
        totalTrades: row.total_trades as number,
        winRate: parseFloat(row.win_rate as string),
        lastLogin: row.lastLogin as string,
        registeredAt: row.registeredAt as string,
        referralCode: row.referral_code as string,
        referredBy: row.referred_by as string | undefined,
        kycStatus: row.kyc_status as string,
        kycDocuments: kycDocs.map((doc: Record<string, unknown>) => ({
          id: doc.id as string,
          type: doc.type as string,
          url: doc.url as string,
          uploadedAt: doc.uploadedAt as string
        })),
        notes: row.notes as string | undefined,
        riskLevel: row.risk_level as string,
        tags: JSON.parse((row.tags as string) || '[]')
      };
    }));

    return NextResponse.json({ users, total });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();

    const newUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      registeredAt: new Date().toISOString(),
      referralCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...userData
    };

    await database.query(`
      INSERT INTO users (
        id, email, full_name, phone, country, status, verified, balance,
        total_deposited, total_withdrawn, total_profit, total_trades, win_rate,
        last_login, registered_at, referral_code, referred_by, kyc_status,
        notes, risk_level, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newUser.id, newUser.email, newUser.fullName, newUser.phone, newUser.country,
      newUser.status, newUser.verified, newUser.balance, newUser.totalDeposited,
      newUser.totalWithdrawn, newUser.totalProfit, newUser.totalTrades, newUser.winRate,
      newUser.lastLogin, newUser.registeredAt, newUser.referralCode, newUser.referredBy,
      newUser.kycStatus, newUser.notes, newUser.riskLevel, JSON.stringify(newUser.tags)
    ]);

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user in database' },
      { status: 500 }
    );
  }
}
