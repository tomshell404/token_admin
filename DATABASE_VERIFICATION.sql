-- =====================================================
-- XAMPP MySQL Database Verification Queries
-- Run these in phpMyAdmin to verify sample data
-- =====================================================

-- 1. BASIC DATA COUNTS
-- =====================================================
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Transactions' as table_name, COUNT(*) as record_count FROM transactions
UNION ALL
SELECT 'KYC Documents' as table_name, COUNT(*) as record_count FROM kyc_documents
UNION ALL
SELECT 'Chat Messages' as table_name, COUNT(*) as record_count FROM chat_messages;

-- Expected Results:
-- Users: ~150
-- Transactions: ~500+
-- KYC Documents: ~20-30
-- Chat Messages: ~50+

-- 2. USER STATISTICS VERIFICATION
-- =====================================================
SELECT
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
    COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_users,
    COUNT(CASE WHEN verified = 1 THEN 1 END) as verified_users,
    COUNT(CASE WHEN verified = 0 THEN 1 END) as unverified_users
FROM users;

-- 3. COUNTRY DISTRIBUTION CHECK
-- =====================================================
SELECT
    country,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentage
FROM users
GROUP BY country
ORDER BY user_count DESC;

-- Expected: 10 different countries

-- 4. KYC STATUS VERIFICATION
-- =====================================================
SELECT
    kyc_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentage
FROM users
GROUP BY kyc_status;

-- 5. RISK LEVEL DISTRIBUTION
-- =====================================================
SELECT
    risk_level,
    COUNT(*) as count,
    AVG(balance) as avg_balance
FROM users
GROUP BY risk_level;

-- 6. TRANSACTION TYPE BREAKDOWN
-- =====================================================
SELECT
    type,
    COUNT(*) as count,
    AVG(amount) as avg_amount,
    SUM(amount) as total_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount
FROM transactions
GROUP BY type
ORDER BY count DESC;

-- 7. TRANSACTION STATUS DISTRIBUTION
-- =====================================================
SELECT
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM transactions), 2) as percentage
FROM transactions
GROUP BY status;

-- 8. FINANCIAL SUMMARY
-- =====================================================
SELECT
    ROUND(SUM(balance), 2) as total_user_balances,
    ROUND(SUM(total_deposited), 2) as total_deposits,
    ROUND(SUM(total_withdrawn), 2) as total_withdrawals,
    ROUND(SUM(total_profit), 2) as total_profits,
    ROUND(AVG(balance), 2) as avg_user_balance,
    COUNT(*) as total_users
FROM users;

-- 9. RECENT ACTIVITY CHECK
-- =====================================================
-- Users registered in last 30 days
SELECT COUNT(*) as new_users_last_30_days
FROM users
WHERE registered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Recent transactions
SELECT COUNT(*) as recent_transactions
FROM transactions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 10. DATA INTEGRITY CHECKS
-- =====================================================
-- Check for users without transactions
SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(DISTINCT user_id) FROM transactions) as users_with_transactions,
    (SELECT COUNT(*) FROM users) - (SELECT COUNT(DISTINCT user_id) FROM transactions) as users_without_transactions;

-- Verify transaction user references exist
SELECT COUNT(*) as orphaned_transactions
FROM transactions t
LEFT JOIN users u ON t.user_id = u.id
WHERE u.id IS NULL;
-- Should be 0

-- 11. SAMPLE DATA PREVIEW
-- =====================================================
-- Top 5 users by balance
SELECT id, full_name, country, balance, status, verified
FROM users
ORDER BY balance DESC
LIMIT 5;

-- Recent transactions
SELECT t.id, t.type, t.amount, t.status, u.full_name, t.created_at
FROM transactions t
JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC
LIMIT 10;

-- Chat activity
SELECT
    COUNT(*) as total_messages,
    COUNT(CASE WHEN is_admin = 1 THEN 1 END) as admin_messages,
    COUNT(CASE WHEN is_admin = 0 THEN 1 END) as user_messages,
    COUNT(DISTINCT user_id) as users_with_chats
FROM chat_messages;

-- 12. PERFORMANCE CHECK
-- =====================================================
-- Check for proper indexing (should be fast)
EXPLAIN SELECT * FROM users WHERE email = 'john.doe1@example.com';
EXPLAIN SELECT * FROM transactions WHERE user_id = 'usr_001';
EXPLAIN SELECT * FROM users WHERE status = 'active' AND country = 'United States';

-- 13. ADVANCED ANALYTICS VERIFICATION
-- =====================================================
-- Monthly registration trend
SELECT
    DATE_FORMAT(registered_at, '%Y-%m') as month,
    COUNT(*) as registrations
FROM users
WHERE registered_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(registered_at, '%Y-%m')
ORDER BY month;

-- Transaction volume by day
SELECT
    DATE(created_at) as date,
    COUNT(*) as transaction_count,
    SUM(amount) as daily_volume
FROM transactions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 14. VALIDATION QUERIES
-- =====================================================
-- Verify email uniqueness
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
-- Should return empty result

-- Verify referral code uniqueness
SELECT referral_code, COUNT(*) as count
FROM users
GROUP BY referral_code
HAVING COUNT(*) > 1;
-- Should return empty result

-- Check for valid JSON in tags
SELECT id, tags
FROM users
WHERE JSON_VALID(tags) = 0;
-- Should return empty result

-- =====================================================
-- EXPECTED RESULTS SUMMARY:
-- =====================================================
/*
✅ USERS: ~150 total
   - Active: ~110 (70-75%)
   - Countries: 10 different
   - Verified: ~70%
   - KYC Status: Mixed distribution

✅ TRANSACTIONS: ~500+ total
   - Types: deposit, withdrawal, trade, bonus, fee
   - Status: ~80% completed, ~10% pending, ~10% other
   - Amount Range: $100 - $5000

✅ CHAT MESSAGES: ~50+ total
   - Mix of user and admin messages
   - Recent activity within 7 days

✅ DATA INTEGRITY:
   - No orphaned records
   - Unique emails and referral codes
   - Valid JSON fields
   - Proper relationships
*/
