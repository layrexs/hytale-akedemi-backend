const Database = require('better-sqlite3');
const path = require('path');

// SQLite veritabanı (Vercel uyumlu)
const dbPath = path.join(__dirname, 'hytale.db');
const db = new Database(dbPath);

// Tabloları oluştur
function initDatabase() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        coins INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ SQLite tabloları oluşturuldu');
  } catch (error) {
    console.error('❌ Database init hatası:', error);
  }
}

// Database'i başlat
initDatabase();

module.exports = db;
