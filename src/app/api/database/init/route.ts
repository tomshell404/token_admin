import { NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function POST() {
  try {
    await database.initializeDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize database. Please ensure XAMPP MySQL is running.'
      },
      { status: 500 }
    );
  }
}
