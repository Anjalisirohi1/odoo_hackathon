// controllers/dashboard.controller.js
import db from '../database/db.js';

export const getDashboardStats = async (req, res) => {
    try {
        // Run all database count queries concurrently for high performance
        const [
            availableRes,
            allocatedRes,
            readyRes,
            bookingsRes,
            transfersRes,
            upcomingRes,
            overdueRes,
            activityRes
        ] = await Promise.all([
            // Card 1: Available Assets
            db.query("SELECT COUNT(*)::int as count FROM assets WHERE status = 'AVAILABLE'"),
            // Card 2: Allocated Assets
            db.query("SELECT COUNT(*)::int as count FROM assets WHERE status = 'ALLOCATED'"),
            // Card 3: Ready for Deployment (Available assets with 'New' or 'Excellent' condition status)
            db.query("SELECT COUNT(*)::int as count FROM assets WHERE status = 'AVAILABLE' AND condition IN ('New', 'Excellent')"),

            // Mini-Card 1: Active Bookings (Upcoming + Ongoing)
            db.query("SELECT COUNT(*)::int as count FROM bookings WHERE status IN ('UPCOMING', 'ONGOING')"),
            // Mini-Card 2: Pending Transfers
            db.query("SELECT COUNT(*)::int as count FROM transfer_requests WHERE status = 'PENDING'"),
            // Mini-Card 3: Upcoming Returns (Active allocations due in the next 7 days)
            db.query(`
        SELECT COUNT(*)::int as count FROM allocations 
        WHERE status = 'ACTIVE' 
        AND expected_return_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      `),
            // Mini-Card 4: Overdue Returns (Expected return date is in the past)
            db.query(`
        SELECT COUNT(*)::int as count FROM allocations 
        WHERE status = 'ACTIVE' 
        AND expected_return_at < NOW()
      `),

            // Recent Activity Stream (Fetched from Audit Logs)
            db.query(`
        SELECT al.id, al.action, al.details, al.created_at, u.name as user_name 
        FROM audit_logs al 
        LEFT JOIN users u ON al.user_id = u.id 
        ORDER BY al.created_at DESC 
        LIMIT 10
      `)
        ]);

        res.status(200).json({
            kpis: {
                availableAssets: availableRes.rows[0].count,
                allocatedAssets: allocatedRes.rows[0].count,
                readyForDeployment: readyRes.rows[0].count,
                activeBookings: bookingsRes.rows[0].count,
                pendingTransfers: transfersRes.rows[0].count,
                upcomingReturns: upcomingRes.rows[0].count,
                overdueReturns: overdueRes.rows[0].count
            },
            recentActivity: activityRes.rows.map(row => ({
                id: row.id,
                action: row.action,
                details: row.details, // Contains JSON payload with customized descriptive text
                createdAt: row.created_at,
                performedBy: row.user_name || 'System'
            }))
        });

    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        res.status(500).json({ error: 'Failed to retrieve dashboard metrics.' });
    }
};