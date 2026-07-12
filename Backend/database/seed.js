// database/seed.js
import bcrypt from 'bcryptjs';
import db from './db.js';

async function seedDatabase() {
    const email = process.env.ADMIN_EMAIL || 'admin@assetflow.com';
    const password = process.env.ADMIN_PASSWORD || 'AdminPass2026!';
    const name = 'System Administrator';

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        // SQL query to insert or update the admin
        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, role, status) 
       VALUES ($1, $2, $3, 'ADMIN'::user_role, 'ACTIVE'::user_status) 
       ON CONFLICT (email) 
       DO UPDATE SET name = $1, password_hash = $3
       RETURNING id, name, email, role;`,
            [name, email, passwordHash]
        );

        console.log('\n============================================');
        console.log('   DATABASE SEED SUCCESSFUL!                ');
        console.log(`   Admin Email:    ${result.rows[0].email}  `);
        console.log(`   Admin Role:     ${result.rows[0].role}   `);
        console.log('============================================\n');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        // Close the database pool so the Node process terminates
        await db.pool.end();
    }
}

seedDatabase();