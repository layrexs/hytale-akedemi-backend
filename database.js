const Database = require('better-sqlite3');
const path = require('path');

// Vercel için geçici SQLite (memory-based)
let db;

function initDatabase() {
  try {
    // Vercel'de dosya sistemi read-only olduğu için memory database kullan
    if (process.env.VERCEL) {
      console.log('🔄 Vercel ortamı tespit edildi, memory database kullanılıyor...');
      db = new Database(':memory:');
    } else {
      // Local development için dosya tabanlı database
      const dbPath = path.join(__dirname, 'hytale.db');
      db = new Database(dbPath);
    }

    // Tabloları oluştur
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
    // Fallback: Memory database
    db = new Database(':memory:');
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
    console.log('✅ Fallback memory database oluşturuldu');
  }
}

// Database'i başlat
initDatabase();

module.exports = db;
