import mysql from 'mysql2/promise';

// Database configuration for XAMPP
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Default XAMPP MySQL password is empty
  database: 'token_trade_admin',
  port: 3306,
  timezone: '+00:00',
  charset: 'utf8mb4'
};

class Database {
  private connection: mysql.Connection | null = null;

  async connect(): Promise<mysql.Connection> {
    if (this.connection) {
      return this.connection;
    }

    try {
      this.connection = await mysql.createConnection(dbConfig);
      console.log('Connected to MySQL database');
      return this.connection;
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Failed to connect to database. Make sure XAMPP MySQL is running.');
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      console.log('Disconnected from MySQL database');
    }
  }

  async query(sql: string, params?: (string | number | boolean | null)[]): Promise<Record<string, unknown>[]> {
    const connection = await this.connect();
    try {
      const [results] = await connection.execute(sql, params);
      return results as Record<string, unknown>[];
    } catch (error) {
      console.error('Database query failed:', error);
      throw error;
    }
  }

  async beginTransaction(): Promise<void> {
    const connection = await this.connect();
    await connection.beginTransaction();
  }

  async commit(): Promise<void> {
    const connection = await this.connect();
    await connection.commit();
  }

  async rollback(): Promise<void> {
    const connection = await this.connect();
    await connection.rollback();
  }

  // Initialize database with tables and sample data
  async initializeDatabase(): Promise<void> {
    try {
      // Create database if it doesn't exist
      const tempConnection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        port: dbConfig.port
      });

      await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      await tempConnection.end();

      // Connect to the database
      await this.connect();

      // Create tables
      await this.createTables();

      // Check if we need to add sample data
      const userCount = await this.query('SELECT COUNT(*) as count FROM users');
      if (userCount[0].count === 0) {
        await this.insertSampleData();
        console.log('Sample data inserted successfully');
      }

    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    // Users table
    await this.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        country VARCHAR(100) NOT NULL,
        status ENUM('active', 'inactive', 'suspended', 'pending') DEFAULT 'pending',
        verified BOOLEAN DEFAULT FALSE,
        balance DECIMAL(15,2) DEFAULT 0.00,
        total_deposited DECIMAL(15,2) DEFAULT 0.00,
        total_withdrawn DECIMAL(15,2) DEFAULT 0.00,
        total_profit DECIMAL(15,2) DEFAULT 0.00,
        total_trades INT DEFAULT 0,
        win_rate DECIMAL(5,2) DEFAULT 0.00,
        last_login DATETIME,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        referral_code VARCHAR(20) UNIQUE NOT NULL,
        referred_by VARCHAR(50),
        kyc_status ENUM('pending', 'approved', 'rejected', 'not_submitted') DEFAULT 'not_submitted',
        notes TEXT,
        risk_level ENUM('low', 'medium', 'high') DEFAULT 'low',
        tags JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_country (country),
        INDEX idx_kyc_status (kyc_status),
        INDEX idx_registered_at (registered_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Admin users table 
    await this.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
         id INT UNSIGNED NOT NULL AUTO_INCREMENT,
         full_name VARCHAR(255) NOT NULL,
         email VARCHAR(255) NOT NULL UNIQUE,
         password_hash VARCHAR(255) NOT NULL,
         role VARCHAR(50) NOT NULL DEFAULT 'admin',
         session_token VARCHAR(255) DEFAULT NULL,
         created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
         updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);



    // Transactions table
    await this.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('deposit', 'withdrawal', 'trade', 'bonus', 'fee') NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
        tx_hash VARCHAR(255),
        address VARCHAR(255),
        description TEXT NOT NULL,
        admin_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_type (type),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // KYC Documents table
    await this.query(`
      CREATE TABLE IF NOT EXISTS kyc_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('passport', 'drivers_license', 'national_id') NOT NULL,
        url VARCHAR(500) NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    // Portfolio table to track user investments
    await this.query(`
      CREATE TABLE IF NOT EXISTS portfolios (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          symbol VARCHAR(20) NOT NULL,
          amount DECIMAL(15, 8) NOT NULL,
          average_price DECIMAL(15, 8) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_symbol (user_id, symbol),
          INDEX idx_user_id (user_id),
          INDEX idx_symbol (symbol)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    // User sessions table for secure login management
    await this.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_session_token (session_token),
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Chat messages table for customer support
    await this.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        admin_id VARCHAR(50),
        message TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    // Trad messages table for customer support
    await this.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        type ENUM('long', 'short') NOT NULL,
        amount DECIMAL(20,8) NOT NULL,
        entry_price DECIMAL(20,8) NOT NULL,
        current_price DECIMAL(20,8) NOT NULL,
        duration INT NOT NULL,
        status ENUM('active','completed','cancelled') NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME DEFAULT NULL,
        profit DECIMAL(20,8) DEFAULT 0,
        profit_percentage DECIMAL(10,2) DEFAULT 0,
        is_auto_trade TINYINT(1) DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('Database tables created successfully');
  }

  private async insertSampleData(): Promise<void> {
    // Generate comprehensive sample data
    const countries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'Australia', 'Singapore', 'Switzerland', 'Netherlands'];
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa', 'Alex', 'Maria', 'Robert', 'Emily', 'James', 'Anna', 'Daniel'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];

    const users = [];
    const transactions = [];
    const chatMessages = [];

    // Generate 150 users
    for (let i = 1; i <= 150; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const id = i; // Use integer IDs for users
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      const password_hash ='$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
      const country = countries[Math.floor(Math.random() * countries.length)];

      const registeredDaysAgo = Math.floor(Math.random() * 365);
      const registeredAt = new Date(Date.now() - registeredDaysAgo * 24 * 60 * 60 * 1000);
      const lastLoginHoursAgo = Math.floor(Math.random() * 168); // Within last week
      const lastLogin = new Date(Date.now() - lastLoginHoursAgo * 60 * 60 * 1000);

      const totalDeposited = Math.floor(Math.random() * 50000) + 1000;
      const totalWithdrawn = Math.floor(Math.random() * (totalDeposited * 0.7));
      const totalTrades = Math.floor(Math.random() * 500) + 10;
      const winRate = Math.random() * 40 + 30; // 30-70%
      const totalProfit = (totalDeposited - totalWithdrawn) * (winRate / 100) * 0.1;
      const balance = totalDeposited - totalWithdrawn + totalProfit;

      const statuses = ['active', 'inactive', 'suspended', 'pending'];
      const kycStatuses = ['pending', 'approved', 'rejected', 'not_submitted'];
      const riskLevels = ['low', 'medium', 'high'];

      const user = {
        id: id,
        email: email,
        password_hash,
        full_name: `${firstName} ${lastName}`,
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        country: country,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        verified: Math.random() > 0.3,
        balance: Math.max(0, balance),
        total_deposited: totalDeposited,
        total_withdrawn: totalWithdrawn,
        total_profit: totalProfit,
        total_trades: totalTrades,
        win_rate: winRate,
        last_login: lastLogin.toISOString().slice(0, 19).replace('T', ' '),
        registered_at: registeredAt.toISOString().slice(0, 19).replace('T', ' '),
        referral_code: Math.random().toString(36).substr(2, 8).toUpperCase(),
        referred_by: i > 50 && Math.random() > 0.7 ? `usr_${Math.floor(Math.random() * (i-1) + 1).toString().padStart(3, '0')}` : null,
        kyc_status: kycStatuses[Math.floor(Math.random() * kycStatuses.length)],
        notes: Math.random() > 0.8 ? 'High value customer' : null,
        risk_level: riskLevels[Math.floor(Math.random() * riskLevels.length)],
        tags: JSON.stringify(this.generateUserTags())
      };

      users.push(user);

      // Generate 3-8 transactions per user
      const transactionCount = Math.floor(Math.random() * 6) + 3;
      for (let j = 1; j <= transactionCount; j++) {
        const transactionTypes = ['deposit', 'withdrawal', 'trade', 'bonus', 'fee'];
        const transactionStatuses = ['pending', 'completed', 'failed', 'cancelled'];
        const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];

        let amount = Math.floor(Math.random() * 5000) + 100;
        if (type === 'withdrawal' || type === 'fee') amount = -amount;

        const createdDaysAgo = Math.floor(Math.random() * registeredDaysAgo);
        const createdAt = new Date(registeredAt.getTime() + createdDaysAgo * 24 * 60 * 60 * 1000);
        const status = transactionStatuses[Math.floor(Math.random() * transactionStatuses.length)];

        const transaction = {
          id: `txn_${i}_${j}`,
          user_id: user.id,
          type: type,
          amount: amount,
          currency: 'USD',
          status: status,
          tx_hash: Math.random() > 0.5 ? `0x${Math.random().toString(16).substr(2, 64)}` : null,
          description: this.generateTransactionDescription(type, amount),
          admin_notes: status === 'failed' ? 'Automatic verification failed' : null,
          created_at: createdAt.toISOString().slice(0, 19).replace('T', ' '),
          completed_at: status === 'completed' ? new Date(createdAt.getTime() + Math.random() * 3600000).toISOString().slice(0, 19).replace('T', ' ') : null
        };

        transactions.push(transaction);
      }

      // Generate some chat messages for random users
      if (Math.random() > 0.7) {
        const messageCount = Math.floor(Math.random() * 5) + 1;
        for (let k = 1; k <= messageCount; k++) {
          const isAdmin = k % 2 === 0;
          const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Within last week

          const message = {
            id: `msg_${i}_${k}`,
            user_id: user.id,
            admin_id: isAdmin ? 'admin_001' : null,
            message: isAdmin ? this.generateAdminMessage() : this.generateUserMessage(),
            is_admin: isAdmin,
            created_at: createdAt.toISOString().slice(0, 19).replace('T', ' ')
          };

          chatMessages.push(message);
        }
      }
    }

    // Insert users
    for (const user of users) {
      await this.query(`
        INSERT INTO users (
          id, email, password_hash, full_name, phone, country, status, verified, balance,
          total_deposited, total_withdrawn, total_profit, total_trades, win_rate,
          last_login, registered_at, referral_code, referred_by, kyc_status,
          notes, risk_level, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id, user.email, user.password_hash, user.full_name, user.phone, user.country, user.status,
        user.verified, user.balance, user.total_deposited, user.total_withdrawn,
        user.total_profit, user.total_trades, user.win_rate, user.last_login,
        user.registered_at, user.referral_code, user.referred_by, user.kyc_status,
        user.notes, user.risk_level, user.tags
      ]);
    }

  // Insert an admin user of admin role
  await this.query(`
    INSERT INTO admin_users (full_name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `, [
    'Admin User',
    'admin@example.com',
    '$2y$10$RXc61fWvjX2NZLWt/Hvf.eGwwQh.pDUGNow8L4Mztj0oDDR3731.6', // bcrypt hash for 'letmein'
    'admin'
  ]);

  // Insert an admin user of superadmin role
  await this.query(`
    INSERT INTO admin_users (full_name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `, [
    'Super Admin',
    'superadmin@example.com',
    '$2y$10$RXc61fWvjX2NZLWt/Hvf.eGwwQh.pDUGNow8L4Mztj0oDDR3731.6', // bcrypt hash for 'letmein'
    'admin'
  ]);

    // Insert transactions
    for (const transaction of transactions) {
      await this.query(`
        INSERT INTO transactions (
          id, user_id, type, amount, currency, status, tx_hash,
          description, admin_notes, created_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transaction.id, transaction.user_id, transaction.type, transaction.amount,
        transaction.currency, transaction.status, transaction.tx_hash,
        transaction.description, transaction.admin_notes, transaction.created_at,
        transaction.completed_at
      ]);
    }

    // Insert chat messages
    for (const message of chatMessages) {
      await this.query(`
        INSERT INTO chat_messages (id, user_id, admin_id, message, is_admin, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        message.id, message.user_id, message.admin_id, message.message,
        message.is_admin, message.created_at
      ]);
    }

    console.log(`Inserted ${users.length} users, ${transactions.length} transactions, and ${chatMessages.length} chat messages`);
  }

  private generateUserTags(): string[] {
    const allTags = ['vip', 'high-volume', 'new-user', 'risk', 'suspended', 'verified', 'premium', 'whale', 'day-trader', 'long-term'];
    const tagCount = Math.floor(Math.random() * 3) + 1;
    const selectedTags: string[] = [];

    for (let i = 0; i < tagCount; i++) {
      const tag = allTags[Math.floor(Math.random() * allTags.length)];
      if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
      }
    }

    return selectedTags;
  }

  private generateTransactionDescription(type: string, amount: number): string {
    const descriptions = {
      deposit: [
        'Bank wire transfer deposit',
        'Credit card deposit',
        'Cryptocurrency deposit',
        'Wire transfer deposit',
        'PayPal deposit'
      ],
      withdrawal: [
        'Bank withdrawal request',
        'Cryptocurrency withdrawal',
        'Wire transfer withdrawal',
        'Profit withdrawal',
        'Emergency withdrawal'
      ],
      trade: [
        'BTC/USD trade profit',
        'ETH/USD trade profit',
        'Forex trade profit',
        'Stock trade profit',
        'Commodity trade profit'
      ],
      bonus: [
        'Welcome bonus',
        'Referral bonus',
        'Loyalty bonus',
        'Trading bonus',
        'VIP bonus'
      ],
      fee: [
        'Trading fee',
        'Withdrawal fee',
        'Maintenance fee',
        'Premium fee',
        'Transaction fee'
      ]
    };

    const typeDescriptions = descriptions[type as keyof typeof descriptions] || ['Transaction'];
    return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
  }

  private generateUserMessage(): string {
    const messages = [
      'Hi, I need help with my withdrawal request',
      'Can you please verify my account?',
      'I\'m having trouble accessing my dashboard',
      'When will my deposit be processed?',
      'I need to update my phone number',
      'Can you explain the trading fees?',
      'Is there a mobile app available?',
      'How do I enable two-factor authentication?'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private generateAdminMessage(): string {
    const messages = [
      'Thank you for contacting support. I\'ll help you with that.',
      'Your request has been forwarded to our verification team.',
      'Please allow 1-2 business days for processing.',
      'I\'ve updated your account settings as requested.',
      'Your withdrawal has been approved and processed.',
      'Please check your email for verification instructions.',
      'Is there anything else I can help you with today?',
      'Your account verification is now complete.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

export const database = new Database();
