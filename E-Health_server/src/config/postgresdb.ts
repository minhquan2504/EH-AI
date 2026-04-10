import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('❌ Lỗi PostgreSQL Pool ngầm:', err.message);
});

export const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Kết nối PostgreSQL thành công');
        client.release();
    } catch (error) {
        console.error('❌ Kết nối database thất bại:', error);
        process.exit(1);
    }
};

export const closeDB = async () => {
    try {
        await pool.end();
        console.log('🔌 Đã đóng kết nối PostgreSQL Pool an toàn.');
    } catch (error) {
        console.error('❌ Lỗi khi đóng kết nối PostgreSQL:', error);
    }
};