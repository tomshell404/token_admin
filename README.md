# Token Trade Admin Dashboard - XAMPP MySQL Setup Guide

## 🎯 Overview
This admin dashboard has been migrated from localStorage to XAMPP MySQL database for better performance, scalability, and data persistence. The database includes comprehensive sample data with 150+ users, 500+ transactions, and chat messages.

## 📋 Prerequisites
- XAMPP installed on your system
- Node.js and Bun package manager
- Web browser

## 🚀 Step-by-Step Setup Guide

### Step 1: Install and Start XAMPP
1. **Download XAMPP** from https://www.apachefriends.org/
2. **Install XAMPP** on your system
3. **Open XAMPP Control Panel**
4. **Start Apache and MySQL services** by clicking the "Start" buttons

### Step 2: Access phpMyAdmin (Optional - for manual database management)
1. Open your web browser
2. Go to `http://localhost/phpmyadmin`
3. You can use this interface to view and manage your database manually

### Step 3: Start the Application
1. **Open terminal/command prompt**
2. **Navigate to the project directory**:
   ```bash
   cd token-trade-admin
   ```
3. **Install dependencies**:
   ```bash
   bun install
   ```
4. **Start the development server**:
   ```bash
   bun run dev
   ```
5. **Open your browser** and go to `http://localhost:3000`

### Step 4: Database Auto-Initialization
The application will automatically:
- ✅ Create the `token_trade_admin` database
- ✅ Create all necessary tables (users, transactions, kyc_documents, chat_messages)
- ✅ Insert comprehensive sample data (150 users, 500+ transactions)
- ✅ Set up relationships and indexes

**No manual database setup required!** 🎉

## 📊 Sample Data Included

### Users (150 total)
- **Active Users**: ~110
- **Countries**: 10 different countries (US, Canada, UK, Germany, France, Japan, Australia, Singapore, Switzerland, Netherlands)
- **Verification Status**: Mix of verified/unverified users
- **KYC Status**: Pending, approved, rejected, not submitted
- **Risk Levels**: Low, medium, high
- **Balances**: Realistic trading balances ranging from $0 to $50,000+

### Transactions (500+ total)
- **Types**: Deposits, withdrawals, trades, bonuses, fees
- **Status**: Pending, completed, failed, cancelled
- **Currencies**: USD (primary)
- **Amounts**: Realistic transaction amounts
- **Time Range**: Distributed over the last year

### Chat Messages
- **User Support**: Sample customer support conversations
- **Admin Responses**: Professional support responses
- **Timestamps**: Recent conversations for testing

## 🗄️ Database Schema

### Tables Created:
1. **`users`** - User profiles, balances, KYC info
2. **`transactions`** - All financial transactions
3. **`kyc_documents`** - KYC document uploads
4. **`chat_messages`** - Customer support chat

### Key Features:
- Foreign key relationships
- Proper indexes for performance
- JSON fields for flexible data (tags, etc.)
- Automatic timestamps
- UTF8MB4 charset for emoji support

## 🔧 Configuration

### Database Connection (.env.local)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=token_trade_admin
DB_PORT=3306
NODE_ENV=development
```

### XAMPP Default Settings
- **Host**: localhost
- **Username**: root
- **Password**: (empty)
- **Port**: 3306

## 🎛️ Admin Dashboard Features

### 📊 Dashboard Home
- **User Statistics**: Total users, active users, new registrations
- **Financial Overview**: Total balances, deposits, withdrawals
- **Real-time Metrics**: Pending verifications, suspended accounts
- **Recent Activity**: Latest users and transactions

### 👥 User Management
- **Search & Filter**: By status, country, verification, balance
- **User Details**: Complete user profiles with transaction history
- **Bulk Actions**: Verify users, update status, export data
- **KYC Management**: Approve/reject verification documents

### 💰 Transaction Management
- **Transaction History**: All deposits, withdrawals, trades
- **Status Control**: Approve/reject pending transactions
- **Financial Tracking**: Revenue analysis and reporting
- **Audit Trail**: Complete transaction logs

### 💬 Chat Management
- **Live Support**: Customer support chat interface
- **Message History**: Complete conversation logs
- **Admin Tools**: Quick responses and user management

### 📈 Analytics
- **User Registration**: Charts showing user growth
- **Country Statistics**: Geographic user distribution
- **Financial Analytics**: Revenue and transaction analysis
- **Performance Metrics**: Platform statistics

### ⚙️ Settings
- **Platform Configuration**: System settings
- **Admin Controls**: Administrative tools
- **Security Settings**: Access control and permissions

## 🛠️ Troubleshooting

### Database Connection Issues
1. **Check XAMPP Status**: Ensure MySQL service is running
2. **Port Conflicts**: Make sure port 3306 is available
3. **Firewall**: Allow MySQL through Windows firewall
4. **Credentials**: Verify database credentials in .env.local

### Common Error Messages
- **"Failed to connect to database"**: XAMPP MySQL not running
- **"Database initialization failed"**: Port or permission issues
- **"Table doesn't exist"**: Database auto-creation in progress

### Solutions
1. **Restart XAMPP**: Stop and start MySQL service
2. **Check Logs**: Look at XAMPP error logs
3. **Reset Database**: Drop database in phpMyAdmin and restart app
4. **Check Permissions**: Ensure MySQL has proper permissions

## 🔄 Data Management

### Backup Database
```sql
mysqldump -u root -p token_trade_admin > backup.sql
```

### Restore Database
```sql
mysql -u root -p token_trade_admin < backup.sql
```

### Reset Sample Data
1. Drop the database in phpMyAdmin
2. Restart the application
3. Sample data will be recreated automatically

## 🚀 Production Deployment

For production deployment:
1. Update database credentials in environment variables
2. Use proper MySQL user (not root)
3. Enable SSL connections
4. Set up database backups
5. Configure proper access controls

## 📞 Support

If you encounter any issues:
1. Check XAMPP Control Panel - ensure MySQL is running
2. Verify database connection in .env.local
3. Look at browser console for error messages
4. Check XAMPP error logs

## 🧪 **Comprehensive Testing Resources**

### 📋 **Testing Documentation:**
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Complete step-by-step testing guide
- **[DATABASE_VERIFICATION.sql](./DATABASE_VERIFICATION.sql)** - SQL queries to verify data
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solutions for common issues

### 🎯 **Quick Testing Checklist:**
1. ✅ **Start XAMPP** - Apache + MySQL services
2. ✅ **Run Application** - `bun run dev`
3. ✅ **Login** - Use demo credentials (sarah@tokentrade.com / password)
4. ✅ **Verify Data** - Check 150 users, 500+ transactions load
5. ✅ **Test Features** - Analytics, user management, transactions
6. ✅ **Run SQL Checks** - Use DATABASE_VERIFICATION.sql in phpMyAdmin

## 🎉 Success Indicators

When everything is working correctly, you should see:
- ✅ **Dashboard Home**: ~150 users, ~$2-3M total balances
- ✅ **User Management**: 150+ users across 10 countries, search/filter works
- ✅ **Transaction Management**: 500+ transactions, approve/reject functionality
- ✅ **Analytics**: Registration charts, country statistics with real data
- ✅ **Chat Management**: Sample conversations and message history
- ✅ **Performance**: Fast loading, no console errors

## 🎊 **The migration from localStorage to XAMPP MySQL is now complete!**

### **What You Get:**
- 🗄️ **Professional MySQL Database** with 4 tables
- 👥 **150 Sample Users** from 10 countries
- 💰 **500+ Sample Transactions** of all types
- 📊 **Rich Analytics** with charts and statistics
- 💬 **Customer Support** chat system
- 🔧 **Admin Tools** for user and transaction management
