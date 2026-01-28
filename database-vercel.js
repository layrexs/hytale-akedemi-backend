// Vercel için PostgreSQL database adaptörü
const { Pool } = require('pg');

let pool;

// PostgreSQL bağlantısı (Vercel için)
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} else {
  // Local development için SQLite
  const Database = require('better-sqlite3');
  const db = new Database('./hytale.db');
  
  // SQLite tabloları oluştur
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  module.exports = db;
}

// PostgreSQL için helper fonksiyonlar
const dbHelpers = {
  async query(text, params) {
    if (!pool) throw new Error('Database not initialized');
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  },

  async prepare(sql) {
    return {
      get: async (params) => {
        const result = await dbHelpers.query(sql, params);
        return result.rows[0] || null;
      },
      all: async (params) => {
        const result = await dbHelpers.query(sql, params);
        return result.rows;
      },
      run: async (params) => {
        const result = await dbHelpers.query(sql, params);
        return { changes: result.rowCount };
      }
    };
  },

  async exec(sql) {
    await dbHelpers.query(sql);
  }
};

// Vercel için PostgreSQL tabloları oluştur
async function initializeDatabase() {
  if (pool) {
    try {
      await dbHelpers.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          level INTEGER DEFAULT 1,
          xp INTEGER DEFAULT 0,
          coins INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ PostgreSQL tabloları oluşturuldu');
    } catch (error) {
      console.error('❌ Database initialization hatası:', error);
    }
  }
}

// Database'i initialize et
if (pool) {
  initializeDatabase();
  module.exports = dbHelpers;
} else {
  // Local SQLite export edildi yukarıda
}