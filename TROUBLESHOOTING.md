# 🛠️ **XAMPP MySQL Troubleshooting Guide**
## Quick Solutions for Common Testing Issues

---

## 🚨 **CRITICAL: Database Connection Issues**

### ❌ Error: "Failed to initialize database. Please ensure XAMPP MySQL is running."

#### **Quick Fixes:**
1. **Check XAMPP Status**:
   ```bash
   # Open XAMPP Control Panel
   # Verify MySQL shows "Running" status
   # If not running, click "Start" button
   ```

2. **Port Conflicts**:
   ```bash
   # Check if port 3306 is in use
   netstat -an | findstr 3306

   # If blocked, stop other MySQL services:
   # Services → MySQL → Stop
   ```

3. **Firewall Issues**:
   ```bash
   # Windows: Allow MySQL through firewall
   # Control Panel → Windows Defender Firewall
   # Allow apps → MySQL
   ```

4. **XAMPP MySQL Won't Start**:
   ```bash
   # Common fix: Change MySQL port
   # XAMPP → Config → my.ini
   # Change port=3306 to port=3307
   # Update .env.local: DB_PORT=3307
   ```

---

## 📊 **Dashboard Loading Issues**

### ❌ Error: Dashboard shows "Loading..." forever

#### **Diagnosis Steps:**
1. **Check Browser Console**:
   ```javascript
   // Press F12 → Console tab
   // Look for red error messages
   // Common errors:
   // - "Network request failed"
   // - "Cannot connect to database"
   // - "API route not found"
   ```

2. **Verify API Routes**:
   ```bash
   # Test API endpoints manually:
   curl http://localhost:3000/api/database/init
   curl http://localhost:3000/api/users/stats
   ```

3. **Database Connection Test**:
   ```bash
   # In phpMyAdmin, run:
   SELECT 1;
   # Should return "1" if database is working
   ```

#### **Solutions:**
- **Restart Services**: Stop/Start XAMPP MySQL
- **Clear Browser Cache**: Ctrl+Shift+R
- **Check .env.local**: Verify database credentials
- **Restart Application**: Stop bun dev, restart

---

## 👥 **User Management Issues**

### ❌ Error: "No users found" or empty user list

#### **Quick Diagnosis:**
```sql
-- Run in phpMyAdmin:
SELECT COUNT(*) FROM users;
-- Should return ~150

-- If 0, sample data wasn't inserted
-- If >0 but UI shows empty, it's an API issue
```

#### **Solutions:**

**If No Data in Database:**
```bash
# Restart application to trigger data insertion
# Stop: Ctrl+C
# Start: bun run dev
# Check console for "Sample data inserted successfully"
```

**If Data Exists but UI Empty:**
```sql
-- Check API response format:
SELECT id, email, full_name FROM users LIMIT 5;
-- Verify data format is correct
```

**If Filtering Not Working:**
```sql
-- Test specific filters:
SELECT * FROM users WHERE status = 'active';
SELECT * FROM users WHERE country = 'United States';
```

---

## 💰 **Transaction Management Issues**

### ❌ Error: Transaction approvals/rejections not working

#### **Check Transaction Status Updates:**
```sql
-- Before approval:
SELECT id, status FROM transactions WHERE status = 'pending' LIMIT 5;

-- Try manual update:
UPDATE transactions SET status = 'completed' WHERE id = 'txn_1_1';

-- Check if update worked:
SELECT id, status FROM transactions WHERE id = 'txn_1_1';
```

#### **API Route Testing:**
```bash
# Test transaction approval API:
curl -X POST http://localhost:3000/api/transactions/txn_1_1/approve

# Test transaction rejection API:
curl -X POST http://localhost:3000/api/transactions/txn_1_1/reject \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test rejection"}'
```

---

## 📈 **Analytics Issues**

### ❌ Error: Charts not displaying or showing no data

#### **Data Verification:**
```sql
-- Check registration data:
SELECT
  DATE(registered_at) as date,
  COUNT(*) as count
FROM users
WHERE registered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(registered_at);

-- Check country data:
SELECT country, COUNT(*) as count
FROM users
GROUP BY country
ORDER BY count DESC;
```

#### **Common Issues:**
- **Date Format**: Check if dates are in correct format
- **Empty Results**: Verify sample data was inserted
- **Chart Library**: Check console for chart rendering errors

#### **Solutions:**
```bash
# Test analytics API endpoints:
curl http://localhost:3000/api/analytics/countries
curl http://localhost:3000/api/analytics/registration-chart?days=30
```

---

## 💬 **Chat Management Issues**

### ❌ Error: No chat messages or conversations not loading

#### **Check Chat Data:**
```sql
-- Verify chat messages exist:
SELECT COUNT(*) FROM chat_messages;

-- Check message distribution:
SELECT
  is_admin,
  COUNT(*) as count
FROM chat_messages
GROUP BY is_admin;
```

---

## 🔧 **Performance Issues**

### ❌ Error: Slow loading times or timeouts

#### **Database Performance Check:**
```sql
-- Check for slow queries:
SHOW PROCESSLIST;

-- Verify indexes exist:
SHOW INDEX FROM users;
SHOW INDEX FROM transactions;
```

#### **Optimization:**
```sql
-- Add indexes if missing:
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
```

---

## 🎯 **Login Issues**

### ❌ Error: Demo credentials not working

#### **Check Login Logic:**
```javascript
// Demo credentials should be:
Manager: sarah@tokentrade.com / password
Support: michael@tokentrade.com / password
Support: emma@tokentrade.com / password

// These are hardcoded in the app, not in database
```

#### **If Login Fails:**
- Check browser console for errors
- Verify no network issues
- Try different browser
- Clear browser cache/cookies

---

## 🆘 **Nuclear Options (When All Else Fails)**

### 1. **Complete Database Reset:**
```sql
-- In phpMyAdmin:
DROP DATABASE IF EXISTS token_trade_admin;
-- Restart application to recreate everything
```

### 2. **Fresh Application Restart:**
```bash
# Stop application: Ctrl+C
# Clear cache:
rm -rf .next/
# Restart:
bun run dev
```

### 3. **XAMPP Full Restart:**
```bash
# XAMPP Control Panel:
# Stop all services
# Start Apache
# Start MySQL
# Wait 30 seconds between each action
```

### 4. **Port Change (Last Resort):**
```bash
# In XAMPP/mysql/bin/my.ini:
port = 3307

# In .env.local:
DB_PORT=3307

# Restart everything
```

---

## ✅ **Health Check Commands**

Run these to verify everything is working:

```sql
-- 1. Database connectivity
SELECT 'Database Connected' as status;

-- 2. Data counts
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM chat_messages) as messages;

-- 3. Sample queries
SELECT COUNT(*) as active_users FROM users WHERE status = 'active';
SELECT COUNT(*) as pending_transactions FROM transactions WHERE status = 'pending';

-- 4. Recent activity
SELECT COUNT(*) as recent_users
FROM users
WHERE registered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### **Expected Results:**
- ✅ Database Connected
- ✅ Users: ~150
- ✅ Transactions: ~500+
- ✅ Messages: ~50+
- ✅ Active Users: ~110
- ✅ Pending Transactions: ~20-50

---

## 📞 **Getting Help**

### If Issues Persist:

1. **Check Console Logs**:
   ```bash
   # In terminal running `bun run dev`:
   # Look for error messages
   # Copy exact error text
   ```

2. **Browser Developer Tools**:
   ```bash
   # Press F12
   # Network tab: Check for failed requests (red)
   # Console tab: Look for JavaScript errors
   ```

3. **Database Logs**:
   ```bash
   # XAMPP/mysql/data/*.err files
   # Look for recent MySQL errors
   ```

4. **API Testing**:
   ```bash
   # Test each API endpoint manually:
   curl http://localhost:3000/api/database/init
   curl http://localhost:3000/api/users/stats
   curl http://localhost:3000/api/users?page=1&limit=10
   ```

---

## 🎉 **Success Indicators**

You know everything is working when:

- ✅ **Login**: Demo credentials work instantly
- ✅ **Dashboard**: Shows ~150 users, financial data
- ✅ **User List**: 3 pages of users, search works
- ✅ **Transactions**: 500+ transactions, can approve/reject
- ✅ **Analytics**: Charts show data for all countries
- ✅ **Performance**: Page loads in <2 seconds
- ✅ **Console**: No red error messages

**🎊 If you see all these, your XAMPP MySQL integration is perfect!**
