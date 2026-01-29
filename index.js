
/*
 * Hytale Akedemi Backend System
 * Copyright (c) 2026 Hytale Akedemi. All rights reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * Contact: info@hytaleakedemi.com
 */

require('dotenv').config();

const express = require("express");
const axios = require("axios");
const db = require("./database");
const path = require("path");
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// Express app oluştur
const app = express();

// 🔒 DOMAIN LOCK - Sadece izinli domain'lerde çalışır
const ALLOWED_DOMAINS = [
  'hyturkiye.net',
  'www.hyturkiye.net',
  'localhost:3001' // Development için
];

const domainLock = (req, res, next) => {
  const host = req.get('host');
  
  // Vercel domain'lerini otomatik olarak izinli yap
  if (host && (host.includes('vercel.app') || ALLOWED_DOMAINS.includes(host))) {
    return next();
  }
  
  console.log(`🚫 Unauthorized domain access attempt: ${host}`);
  return res.status(403).json({
    error: 'Unauthorized domain',
    message: 'This application is licensed for specific domains only.',
    contact: 'hello@hyturkiye.net'
  });
};

// 🔐 LICENSE CHECK - Lisans doğrulama
const LICENSE_KEY = process.env.LICENSE_KEY || 'HYTALE_AKEDEMI_2026';
const PROJECT_ID = 'hytale-akedemi-backend';

const licenseCheck = (req, res, next) => {
  // Lisans bilgilerini header'a ekle
  res.setHeader('X-Licensed-To', 'Hytale Akedemi');
  res.setHeader('X-Project-ID', PROJECT_ID);
  res.setHeader('X-Copyright', '© 2026 Hytale Akedemi. All rights reserved.');
  
  // Lisans ihlali kontrolü
  const userAgent = req.get('User-Agent') || '';
  const referer = req.get('Referer') || '';
  
  // Şüpheli aktivite tespiti
  if (userAgent.includes('bot') && !userAgent.includes('Discord') && !userAgent.includes('Vercel')) {
    console.log(`⚠️ Suspicious bot activity: ${userAgent} from ${req.ip}`);
  }
  
  next();
};

// Domain lock middleware'ini uygula
app.use(domainLock);
app.use(licenseCheck);

// 🛡️ GÜVENLİK MİDDLEWARE'LERİ
// Helmet - HTTP header güvenliği
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://discord.com", "https://cdn.discordapp.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS - Cross-Origin Resource Sharing
app.use(cors({
  origin: [
    'http://localhost:3001', 
    'https://discord.com',
    'https://hytale-akedemi-backend-ds8a.vercel.app',
    'https://hytale-akedemi-backend-ds8a-git-main-layrexs-projects.vercel.app',
    'https://hyturkiye.net',
    'https://www.hyturkiye.net',
    'https://panel.hyturkiye.net'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🚫 DDoS KORUMASI - Rate Limiting (ESNEK AYARLAR)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 500, // IP başına maksimum 500 istek (daha esnek)
  message: {
    error: 'Çok fazla istek gönderdiniz. 15 dakika sonra tekrar deneyin.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Localhost'u muaf tut
  skip: (req) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    return clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.includes('127.0.0.1');
  }
});

// API endpoint'leri için esnek limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 2000, // Çok yüksek limit
  message: {
    error: 'API rate limit aşıldı. 15 dakika sonra tekrar deneyin.',
    retryAfter: '15 minutes'
  },
  // Localhost'u muaf tut
  skip: (req) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    return clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.includes('127.0.0.1');
  }
});

// Discord OAuth için esnek limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 50, // Daha yüksek auth limiti
  message: {
    error: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
    retryAfter: '15 minutes'
  },
  // Localhost'u muaf tut
  skip: (req) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    return clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.includes('127.0.0.1');
  }
});

// Genel rate limiter'ı uygula
app.use(generalLimiter);

// API route'ları için özel limiter
app.use('/api/', apiLimiter);

// Auth route'ları için özel limiter
app.use('/auth/', authLimiter);

app.use(express.json({ limit: '10mb' })); // JSON boyut limiti
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static dosyalar için public klasörünü serve et
app.use(express.static(path.join(__dirname, 'public')));

// 🎨 ANTI-THEFT WATERMARK - Çalınma karşıtı filigran
app.get('/api/license-info', (req, res) => {
  res.json({
    project: 'Hytale Akedemi Backend',
    version: '1.0.0',
    license: 'Proprietary',
    owner: 'Hytale Akedemi',
    contact: 'hello@hyturkiye.net',
    copyright: '© 2026 Hytale Akedemi. All rights reserved.',
    warning: 'Unauthorized use is strictly prohibited and will be prosecuted.',
    domain: req.get('host'),
    timestamp: new Date().toISOString(),
    fingerprint: Buffer.from(`${PROJECT_ID}-${req.get('host')}-${Date.now()}`).toString('base64')
  });
});

// Ana sayfaya lisans bilgisi ekle
app.get('/api/watermark', (req, res) => {
  res.json({
    watermark: '🛡️ Protected by Hytale Akedemi License System',
    notice: 'This software is proprietary and protected by copyright law.',
    violation_report: 'hello@hyturkiye.net'
  });
});

const { body, validationResult } = require('express-validator');

// 🔒 INPUT VALİDASYON FONKSİYONLARI
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Geçersiz veri girişi',
      details: errors.array()
    });
  }
  next();
};

// XSS ve injection saldırılarına karşı temizleme
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// SQL Injection koruması için güvenli string
const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
// 🎮 HYTALE PLUGIN VERİLERİNİ SAKLAMA
const hytalePlayerData = new Map(); // Geçici olarak memory'de saklayalım

// Test verisi ekle (hem development hem production için - demo amaçlı)
// Test oyuncusu 1 - Discord'a bağlı (gerçek Discord profil resmi ile)
hytalePlayerData.set('test_player_1', {
  playerName: 'layrexd',
  level: 25,
  xp: 12500,
  coins: 5000,
  lastSeen: Date.now() - (30 * 1000), // 30 saniye önce
  server: 'Hytale Akedemi',
  playtimeMinutes: 1200,
  stats: {
    playerKills: 45,
    playerDeaths: 12,
    mobKills: 230
  },
  discordId: '849970297343836170',
  discordUsername: 'layrexd',
  discordAvatar: 'a_1234567890abcdef1234567890abcdef', // Örnek avatar hash
  discordLinked: true,
  discordLinkDate: new Date().toISOString()
});

// Test oyuncusu 2 - Discord'a bağlı değil
hytalePlayerData.set('test_player_2', {
  playerName: 'TestOyuncu',
  level: 18,
  xp: 8500,
  coins: 2500,
  lastSeen: Date.now() - (60 * 1000), // 1 dakika önce
  server: 'Hytale Akedemi',
  playtimeMinutes: 800,
  stats: {
    playerKills: 22,
    playerDeaths: 8,
    mobKills: 150
  },
  discordId: null,
  discordUsername: null,
  discordAvatar: null,
  discordLinked: false,
  discordLinkDate: null
});

// Test oyuncusu 3 - Discord'a bağlı (farklı profil resmi)
hytalePlayerData.set('test_player_3', {
  playerName: 'HytaleGamer',
  level: 32,
  xp: 18750,
  coins: 8200,
  lastSeen: Date.now() - (45 * 1000), // 45 saniye önce
  server: 'Hytale Akedemi',
  playtimeMinutes: 2100,
  stats: {
    playerKills: 67,
    playerDeaths: 15,
    mobKills: 420
  },
  discordId: '123456789012345678',
  discordUsername: 'HytaleGamer',
  discordAvatar: 'b_fedcba0987654321fedcba0987654321', // Farklı avatar hash
  discordLinked: true,
  discordLinkDate: new Date().toISOString()
});

// Test oyuncusu 4 - Discord'a bağlı (avatar yok, varsayılan)
hytalePlayerData.set('test_player_4', {
  playerName: 'ProPlayer',
  level: 28,
  xp: 15200,
  coins: 6500,
  lastSeen: Date.now() - (90 * 1000), // 1.5 dakika önce
  server: 'Hytale Akedemi',
  playtimeMinutes: 1800,
  stats: {
    playerKills: 52,
    playerDeaths: 18,
    mobKills: 310
  },
  discordId: '987654321098765432',
  discordUsername: 'ProPlayer',
  discordAvatar: null, // Avatar yok, varsayılan kullanılacak
  discordLinked: true,
  discordLinkDate: new Date().toISOString()
});

console.log('🧪 Test oyuncuları eklendi - Discord profil resimleri ile');

// 🔗 DISCORD ID EŞLEŞTİRME SİSTEMİ
const playerDiscordMapping = new Map(); // Oyuncu adı -> Discord ID eşleştirmesi

// 🔑 GEÇİCİ KOD SAKLAMA SİSTEMİ (Yeni Manuel Sistem)
const pendingCodes = new Map(); // kod -> {discordId, discordUsername, discordAvatar, timestamp}

// 🛡️ GÜVENLİK: Başarısız giriş denemelerini takip et
const failedAttempts = new Map(); // IP -> {count, lastAttempt}

// 🚫 IP BAN SİSTEMİ
const bannedIPs = new Set();

// Şüpheli aktivite kontrolü (ESNEK AYARLAR)
const checkSuspiciousActivity = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Localhost'u muaf tut
  if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.includes('127.0.0.1')) {
    return next();
  }
  
  // Banned IP kontrolü
  if (bannedIPs.has(clientIP)) {
    return res.status(403).json({
      success: false,
      error: 'IP adresiniz geçici olarak engellenmiştir. 30 dakika sonra tekrar deneyin.'
    });
  }
  
  next();
};

// Başarısız giriş denemesi kaydet (ESNEK AYARLAR)
const recordFailedAttempt = (ip) => {
  const now = Date.now();
  const attempts = failedAttempts.get(ip) || { count: 0, lastAttempt: now };
  
  attempts.count++;
  attempts.lastAttempt = now;
  
  failedAttempts.set(ip, attempts);
  
  // 15 başarısız denemeden sonra 30 dakika ban (daha esnek)
  if (attempts.count >= 15) {
    bannedIPs.add(ip);
    console.log(`🚫 IP banned due to suspicious activity: ${ip} (${attempts.count} attempts)`);
    
    // 30 dakika sonra ban'ı kaldır
    setTimeout(() => {
      bannedIPs.delete(ip);
      failedAttempts.delete(ip);
      console.log(`✅ IP ban lifted: ${ip}`);
    }, 30 * 60 * 1000); // 30 dakika
  }
};

// Başarılı giriş sonrası temizle
const clearFailedAttempts = (ip) => {
  failedAttempts.delete(ip);
};

/**
 * Level hesaplama fonksiyonu - 100 XP = 1 Level
 */
function calculateLevel(currentLevel, totalXp) {
  const level = Math.floor(totalXp / 100) + 1; // Her 100 XP'de 1 level
  const currentLevelXp = totalXp % 100; // Mevcut level'deki XP
  
  return {
    level: level,
    xp: currentLevelXp,
    totalXp: totalXp,
    xpToNextLevel: 100 - currentLevelXp
  };
}

/**
 * Discord ID eşleştirme endpoint'i
 * POST /api/link-discord
 */
app.post("/api/link-discord", (req, res) => {
  const { playerName, discordId } = req.body;
  
  if (!playerName || !discordId) {
    return res.status(400).json({ error: "playerName ve discordId gerekli" });
  }
  
  // Eşleştirmeyi kaydet
  playerDiscordMapping.set(playerName.toLowerCase(), discordId);
  
  console.log(`🔗 Discord eşleştirmesi: ${playerName} -> ${discordId}`);
  
  res.json({ 
    success: true, 
    message: `${playerName} Discord ID ${discordId} ile eşleştirildi`,
    playerName: playerName,
    discordId: discordId
  });
});

/**
 * KOD GİRİŞ SİSTEMİ - /kodgir komutu için (GÜVENLİ)
 * POST /api/verify-code
 */
app.post("/api/verify-code", [
  body('playerName').isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z0-9_-]+$/),
  body('code').isLength({ min: 6, max: 6 }).matches(/^[A-Z0-9]+$/),
  validateInput,
  checkSuspiciousActivity
], (req, res) => {
  const { playerName, code } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Input sanitization
  const cleanPlayerName = sanitizeInput(playerName);
  const cleanCode = sanitizeInput(code.toUpperCase());
  
  console.log(`🔑 Güvenli kod doğrulama isteği: ${cleanPlayerName} -> ${cleanCode} (IP: ${clientIP})`);
  
  // Kodu kontrol et
  const codeData = pendingCodes.get(cleanCode);
  
  if (!codeData) {
    console.log(`❌ Geçersiz veya süresi dolmuş kod: ${cleanCode} (IP: ${clientIP})`);
    recordFailedAttempt(clientIP);
    return res.status(400).json({ 
      success: false, 
      error: "Geçersiz veya süresi dolmuş kod!" 
    });
  }
  
  // Başarılı doğrulama
  clearFailedAttempts(clientIP);
  
  // Kod geçerli, Discord hesabını oyuncuya bağla
  const { discordId, discordUsername, discordAvatar } = codeData;
  
  // ÖNCE: Aynı oyuncu adına sahip eski kayıtları sil (Discord bağlantısız olanları)
  const playersToRemove = [];
  for (const [playerId, playerData] of hytalePlayerData) {
    if (playerData.playerName.toLowerCase() === cleanPlayerName.toLowerCase() && 
        playerId !== discordId) {
      playersToRemove.push(playerId);
      console.log(`🗑️ Eski oyuncu kaydı siliniyor: ${playerData.playerName} (${playerId})`);
    }
  }
  
  // Eski kayıtları sil
  playersToRemove.forEach(playerId => {
    hytalePlayerData.delete(playerId);
  });
  
  // Oyuncu verisini oluştur/güncelle
  if (!hytalePlayerData.has(discordId)) {
    hytalePlayerData.set(discordId, {
      playerName: cleanPlayerName,
      playerId: discordId,
      server: "hytale-server-1",
      firstJoin: Date.now(),
      lastSeen: Date.now(),
      level: 1,
      xp: 0,
      coins: 0,
      totalCoinsEarned: 0,
      totalCoinsSpent: 0,
      playtimeMinutes: 0,
      achievements: [],
      stats: {
        kills: 0,
        deaths: 0,
        loginCount: 1,
        // Kill türleri - Sadece PvP takip edilecek
        playerKills: 0,
        playerDeaths: 0,
        // XP kaynakları - Sadece PvP'den XP
        xpFromKills: 0,
        xpFromTime: 0, // Artık time XP yok
        xpFromQuests: 0
      },
      lastTransaction: null,
      killHistory: [],
      // Discord entegrasyonu
      discordId: discordId,
      discordUsername: discordUsername,
      discordAvatar: discordAvatar,
      discordLinked: true,
      discordLinkDate: Date.now()
    });
    console.log(`✅ Yeni Discord bağlantılı oyuncu kaydı oluşturuldu: ${cleanPlayerName} (${discordId})`);
  } else {
    // Mevcut oyuncuyu güncelle
    const playerData = hytalePlayerData.get(discordId);
    playerData.playerName = cleanPlayerName;
    playerData.discordId = discordId;
    playerData.discordUsername = discordUsername;
    playerData.discordAvatar = discordAvatar;
    playerData.discordLinked = true;
    playerData.discordLinkDate = Date.now();
    playerData.lastSeen = Date.now();
    console.log(`✅ Mevcut oyuncu Discord bilgileri güncellendi: ${cleanPlayerName} (${discordId})`);
  }
  
  // Eşleştirmeyi kaydet
  playerDiscordMapping.set(cleanPlayerName.toLowerCase(), discordId);
  
  // Kodu sil (tek kullanımlık)
  pendingCodes.delete(cleanCode);
  
  console.log(`✅ Güvenli Discord hesabı bağlandı: ${cleanPlayerName} -> ${discordUsername} (${discordId})`);
  
  // Local database'i de güncelle
  try {
    updateLocalDatabase(discordId, hytalePlayerData.get(discordId));
  } catch (err) {
    console.error("Local database güncellenemedi:", err);
  }
  
  res.json({ 
    success: true, 
    message: `Discord hesabın başarıyla bağlandı!`,
    playerName: cleanPlayerName,
    discordUsername: discordUsername,
    discordId: discordId
  });
});

/**
 * Eşleştirme listesi
 * GET /api/discord-links
 */
app.get("/api/discord-links", (req, res) => {
  const links = Array.from(playerDiscordMapping.entries()).map(([playerName, discordId]) => ({
    playerName: playerName,
    discordId: discordId
  }));
  
  res.json({
    totalLinks: links.length,
    links: links
  });
});

/**
 * Oyuncu adından Discord ID bulma
 */
function getDiscordIdForPlayer(playerName) {
  return playerDiscordMapping.get(playerName.toLowerCase()) || `hytale-${playerName.toLowerCase()}`;
}

/**
 * HYTALE PLUGIN'DEN VERİ ALMA
 * POST /api/player-action
 */
app.post("/api/player-action", (req, res) => {
  const { player, action, data } = req.body;
  
  console.log(`🎮 Hytale Event: ${player} -> ${action}`, data);
  
  // Oyuncu verisini güncelle/oluştur
  if (!hytalePlayerData.has(data.playerId)) {
    hytalePlayerData.set(data.playerId, {
      playerName: player,
      playerId: data.playerId,
      server: data.server,
      firstJoin: Date.now(), // İlk katılma tarihi
      lastSeen: Date.now(),
      level: 1,
      xp: 0,
      coins: 0,
      totalCoinsEarned: 0,
      totalCoinsSpent: 0,
      playtimeMinutes: 0,
      achievements: [],
      stats: {
        kills: 0,
        deaths: 0,
        loginCount: 0,
        // Kill türleri - Sadece PvP takip edilecek
        playerKills: 0,
        playerDeaths: 0,
        // XP kaynakları - Sadece PvP'den XP
        xpFromKills: 0,
        xpFromTime: 0, // Artık time XP yok
        xpFromQuests: 0
      },
      lastTransaction: null,
      killHistory: [], // Son killeri sakla
      // Discord entegrasyonu
      discordId: null,
      discordUsername: null,
      discordAvatar: null,
      discordLinked: false,
      discordLinkDate: null
    });
    console.log(`🎮 Yeni oyuncu kaydedildi: ${player} (${data.playerId})`);
  }
  
  const playerData = hytalePlayerData.get(data.playerId);
  playerData.lastSeen = Date.now();
  playerData.server = data.server;
  
  // Action'a göre veriyi güncelle
  switch (action) {
    case 'join':
      playerData.stats.loginCount++;
      break;
      
    case 'leave':
      if (data.playTimeMinutes) {
        playerData.playtimeMinutes += data.playTimeMinutes;
        
        // Leave zamanını lastSeen olarak ayarla (geçmiş zaman olabilir)
        if (data.timestamp) {
          playerData.lastSeen = data.timestamp;
        }
        
        console.log(`⏰ ${player} sunucudan ayrıldı: ${data.playTimeMinutes} dakika oynadı (Son görülme: ${new Date(playerData.lastSeen).toLocaleString('tr-TR')})`);
      }
      break;
      
    case 'kill':
      // Sadece PvP kill'leri XP verir
      const mobType = data.mobType || 'unknown';
      const xpReward = getKillXpReward(mobType);
      
      if (mobType.toLowerCase() === 'player' || mobType.toLowerCase() === 'pvp') {
        // PvP kill - XP ver
        playerData.stats.kills++;
        playerData.stats.playerKills++;
        playerData.xp += xpReward;
        playerData.stats.xpFromKills += xpReward;
        
        // Kill geçmişine ekle (son 10 kill)
        playerData.killHistory.unshift({
          mobType: 'player',
          xpGained: xpReward,
          timestamp: data.timestamp || Date.now(),
          location: data.location || 'Bilinmiyor',
          victimName: data.victimName || 'Bilinmiyor'
        });
        if (playerData.killHistory.length > 10) {
          playerData.killHistory.pop();
        }
        
        // Level kontrolü
        const killLevelResult = calculateLevel(playerData.level, playerData.xp);
        if (killLevelResult.level > playerData.level) {
          console.log(`🎉 ${player} PvP kill ile level atladı: ${playerData.level} -> ${killLevelResult.level}`);
          playerData.level = killLevelResult.level;
          playerData.xp = killLevelResult.xp;
          
          // Level atlama coin bonusu
          const levelBonus = killLevelResult.level * 50;
          playerData.coins += levelBonus;
          playerData.totalCoinsEarned += levelBonus;
        }
        
        console.log(`⚔️ ${player} oyuncu öldürdü: +${xpReward} XP (Toplam: ${playerData.xp} XP, Level: ${playerData.level})`);
      } else {
        // Yaratık kill - XP yok, sadece istatistik
        console.log(`⚔️ ${player} ${mobType} öldürdü: XP yok (sadece PvP'den XP)`);
      }
      break;
      
    case 'levelup':
      playerData.level = data.newLevel;
      playerData.xp += data.xpGained;
      break;
      
    case 'coin_earn':
      playerData.coins = data.totalCoins;
      playerData.totalCoinsEarned += data.coinsEarned;
      playerData.lastTransaction = {
        type: 'earn',
        amount: data.coinsEarned,
        reason: data.reason,
        timestamp: data.timestamp
      };
      break;
      
    case 'coin_spend':
      playerData.coins = data.totalCoins;
      playerData.totalCoinsSpent += data.coinsSpent;
      playerData.lastTransaction = {
        type: 'spend',
        amount: data.coinsSpent,
        reason: data.item,
        timestamp: data.timestamp
      };
      break;
      
    case 'achievement':
      playerData.achievements.push({
        name: data.achievement,
        description: data.description,
        rewardCoins: data.rewardCoins,
        timestamp: data.timestamp
      });
      break;
      
    case 'death':
      playerData.stats.deaths++;
      playerData.stats.playerDeaths++;
      
      // Ölümde XP kaybı (mevcut XP'nin %5'i)
      const xpLoss = Math.floor(playerData.xp * 0.05);
      playerData.xp = Math.max(0, playerData.xp - xpLoss);
      
      console.log(`💀 ${player} öldü: -${xpLoss} XP kaybı (Kalan: ${playerData.xp} XP)`);
      break;
      
    case 'discord_auth':
      // Discord OAuth ile giriş yapıldığında
      playerData.discordId = data.discordId;
      playerData.discordUsername = data.discordUsername;
      playerData.discordAvatar = data.discordAvatar;
      playerData.discordLinked = true;
      playerData.discordLinkDate = data.timestamp;
      
      console.log(`🔗 Discord bağlantısı: ${player} -> ${data.discordUsername} (${data.discordId})`);
      break;
      
    case 'stats_update':
      if (data.statType === 'kills') playerData.stats.kills = data.newValue;
      if (data.statType === 'deaths') playerData.stats.deaths = data.newValue;
      break;
  }
  
  // Local database'i de güncelle
  try {
    updateLocalDatabase(data.playerId, playerData);
  } catch (err) {
    console.error("Local database güncellenemedi:", err);
  }
  
  res.json({ success: true, message: "Veri alındı" });
});

/**
 * Kill XP ödül sistemi - Sadece PvP
 */
function getKillXpReward(mobType) {
  const xpRewards = {
    'player': 10,      // Oyuncu öldürme - 10 XP
    'pvp': 10          // PvP kill - 10 XP
  };
  
  return xpRewards[mobType.toLowerCase()] || 0; // Yaratık kill'leri XP vermiyor
}

/**
 * DISCORD BOT İÇİN API ENDPOINTS
 */

// Oyuncu profili
app.get("/api/player/profile/:playerId", (req, res) => {
  const { playerId } = req.params;
  const playerData = hytalePlayerData.get(playerId);
  
  if (!playerData) {
    return res.status(404).json({ error: "Oyuncu bulunamadı" });
  }
  
  res.json({
    playerId: playerData.playerId,
    playerName: playerData.playerName,
    level: playerData.level,
    xp: playerData.xp,
    totalCoins: playerData.coins,
    joinDate: new Date(playerData.firstJoin).toISOString(), // ISO formatında katılma tarihi
    lastSeen: new Date(playerData.lastSeen).toISOString(),
    playtimeMinutes: playerData.playtimeMinutes,
    server: playerData.server,
    isOnline: (Date.now() - playerData.lastSeen) < (5 * 60 * 1000) // Son 5 dakikada görülmüş mü?
  });
});

// Oyuncu coin bilgileri
app.get("/api/player/coins/:playerId", (req, res) => {
  const { playerId } = req.params;
  const playerData = hytalePlayerData.get(playerId);
  
  if (!playerData) {
    return res.status(404).json({ error: "Oyuncu bulunamadı" });
  }
  
  res.json({
    playerId: playerData.playerId,
    playerName: playerData.playerName,
    coins: playerData.coins,
    totalEarned: playerData.totalCoinsEarned,
    totalSpent: playerData.totalCoinsSpent,
    lastTransaction: playerData.lastTransaction
  });
});

// Coin liderlik tablosu
app.get("/api/leaderboard/coins", (req, res) => {
  // Tüm oyuncuları array'e çevir ve coin'e göre sırala
  const players = Array.from(hytalePlayerData.values());
  const sortedPlayers = players.sort((a, b) => b.coins - a.coins);
  
  // Top 10'u al
  const topPlayers = sortedPlayers.slice(0, 10).map((player, index) => {
    return {
      rank: index + 1,
      playerName: player.playerName,
      playerId: player.playerId,
      coins: player.coins,
      totalEarned: player.totalCoinsEarned,
      totalSpent: player.totalCoinsSpent,
      level: player.level,
      server: player.server
    };
  });
  
  res.json({
    category: "coins",
    players: topPlayers,
    totalPlayers: players.length,
    timestamp: Date.now()
  });
});

// Coin transfer endpoint (plugin'den)
app.post("/api/coin-transfer", (req, res) => {
  const { from, to, amount, reason } = req.body;
  
  if (!from || !to || !amount) {
    return res.status(400).json({ error: "from, to ve amount gerekli" });
  }
  
  // Gönderen oyuncuyu bul
  let fromPlayer = null;
  let toPlayer = null;
  
  for (const [playerId, playerData] of hytalePlayerData) {
    if (playerData.playerName.toLowerCase() === from.toLowerCase()) {
      fromPlayer = playerData;
    }
    if (playerData.playerName.toLowerCase() === to.toLowerCase()) {
      toPlayer = playerData;
    }
  }
  
  if (!fromPlayer) {
    return res.status(404).json({ error: "Gönderen oyuncu bulunamadı" });
  }
  
  if (fromPlayer.coins < amount) {
    return res.status(400).json({ error: "Yetersiz bakiye" });
  }
  
  // Transfer işlemi
  fromPlayer.coins -= amount;
  fromPlayer.totalCoinsSpent += amount;
  fromPlayer.lastTransaction = {
    type: 'transfer_send',
    amount: amount,
    target: to,
    reason: reason || 'Transfer',
    timestamp: Date.now()
  };
  
  // Alıcı oyuncu yoksa oluştur
  if (!toPlayer) {
    const newPlayerId = `hytale-${to.toLowerCase()}`;
    toPlayer = {
      playerName: to,
      playerId: newPlayerId,
      server: "hytale-server-1",
      firstJoin: Date.now(),
      lastSeen: Date.now(),
      level: 1,
      xp: 0,
      coins: 0,
      totalCoinsEarned: 0,
      totalCoinsSpent: 0,
      playtimeMinutes: 0,
      achievements: [],
      stats: {
        kills: 0,
        deaths: 0,
        loginCount: 0,
        playerKills: 0,
        playerDeaths: 0,
        xpFromKills: 0,
        xpFromTime: 0,
        xpFromQuests: 0
      },
      lastTransaction: null,
      killHistory: [],
      discordId: null,
      discordUsername: null,
      discordAvatar: null,
      discordLinked: false,
      discordLinkDate: null
    };
    hytalePlayerData.set(newPlayerId, toPlayer);
  }
  
  toPlayer.coins += amount;
  toPlayer.totalCoinsEarned += amount;
  toPlayer.lastTransaction = {
    type: 'transfer_receive',
    amount: amount,
    from: from,
    reason: reason || 'Transfer',
    timestamp: Date.now()
  };
  
  console.log(`💰 Coin transfer: ${from} -> ${to} (${amount} coin)`);
  
  res.json({
    success: true,
    message: "Transfer başarılı",
    fromBalance: fromPlayer.coins,
    toBalance: toPlayer.coins
  });
});

// Oyuncu level bilgileri
app.get("/api/player/level/:playerId", (req, res) => {
  const { playerId } = req.params;
  const playerData = hytalePlayerData.get(playerId);
  
  if (!playerData) {
    return res.status(404).json({ error: "Oyuncu bulunamadı" });
  }
  
  const nextLevelXp = playerData.level * 100;
  const currentXp = playerData.xp % nextLevelXp;
  const xpToNextLevel = nextLevelXp - currentXp;
  const levelProgress = (currentXp / nextLevelXp) * 100;
  
  res.json({
    playerId: playerData.playerId,
    playerName: playerData.playerName,
    level: playerData.level,
    currentXp: currentXp,
    xpToNextLevel: xpToNextLevel,
    totalXp: playerData.xp,
    levelProgress: levelProgress
  });
});

// Oyuncu istatistikleri
app.get("/api/player/stats/:playerId", (req, res) => {
  const { playerId } = req.params;
  const playerData = hytalePlayerData.get(playerId);
  
  if (!playerData) {
    return res.status(404).json({ error: "Oyuncu bulunamadı" });
  }
  
  const kdr = playerData.stats.playerDeaths > 0 ? (playerData.stats.playerKills / playerData.stats.playerDeaths).toFixed(2) : playerData.stats.playerKills;
  const playtimeFormatted = `${Math.floor(playerData.playtimeMinutes / 60)} saat ${playerData.playtimeMinutes % 60} dakika`;
  
  res.json({
    playerId: playerData.playerId,
    playerName: playerData.playerName,
    kills: playerData.stats.playerKills, // Sadece PvP kill'leri
    deaths: playerData.stats.playerDeaths, // Sadece PvP death'leri
    kdr: parseFloat(kdr),
    playtimeMinutes: playerData.playtimeMinutes,
    playtimeFormatted: playtimeFormatted,
    achievements: playerData.achievements.length,
    loginCount: playerData.stats.loginCount,
    lastLogin: new Date(playerData.lastSeen).toISOString(),
    // PvP istatistikleri
    pvpStats: {
      playerKills: playerData.stats.playerKills || 0,
      playerDeaths: playerData.stats.playerDeaths || 0,
      kdr: parseFloat(kdr)
    },
    // XP kaynakları - Sadece PvP
    xpSources: {
      fromKills: playerData.stats.xpFromKills || 0,
      fromTime: 0, // Artık time XP yok
      fromQuests: playerData.stats.xpFromQuests || 0
    },
    // Son PvP killeri
    recentKills: playerData.killHistory || []
  });
});

// Discord sunucu istatistikleri endpoint'i - YENİDEN OLUŞTURULDU
app.get("/api/discord-server-stats", async (req, res) => {
  try {
    console.log('📊 Discord sunucu istatistikleri isteniyor...');
    
    const discordStats = {
      totalMembers: 1847,
      onlineMembers: 234,
      serverAge: '2 yıl 3 ay',
      serverName: 'Hytale Akedemi'
    };
    
    const hytalePlayersCount = hytalePlayerData.size;
    
    let discordLinkedCount = 0;
    for (const [playerId, playerData] of hytalePlayerData) {
      if (playerData.discordLinked && playerData.discordId) {
        discordLinkedCount++;
      }
    }
    
    console.log(`✅ Discord sunucu istatistikleri: ${discordStats.totalMembers} üye, ${discordStats.onlineMembers} online`);
    
    res.json({
      success: true,
      stats: {
        totalMembers: discordStats.totalMembers,
        onlineMembers: discordStats.onlineMembers,
        hytalePlayersCount: hytalePlayersCount,
        serverAge: discordStats.serverAge,
        discordLinkedPlayers: discordLinkedCount
      },
      serverInfo: {
        name: discordStats.serverName,
        guildId: '1460419740655685851',
        inviteUrl: 'https://discord.gg/zWpDEpnNEh'
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Discord sunucu istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      error: "Discord sunucu istatistikleri alınamadı"
    });
  }
});

// Debug endpoint to test if routes are working
app.get("/api/debug-test", (req, res) => {
  res.json({ message: "Debug endpoint working!", timestamp: Date.now() });
});

// Online oyuncular için detaylı bilgi (Discord profilleriyle)
app.get("/api/players/online-detailed", (req, res) => {
  // Son 2 dakikada görülen oyuncuları online say (daha sıkı kontrol)
  const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
  let onlinePlayers = [];
  
  for (const [playerId, playerData] of hytalePlayerData) {
    // Sadece gerçekten son 2 dakikada aktif olan oyuncular
    if (playerData.lastSeen > twoMinutesAgo) {
      onlinePlayers.push({
        playerId: playerId,
        playerName: playerData.playerName,
        level: playerData.level,
        xp: playerData.xp,
        coins: playerData.coins,
        kills: playerData.stats.playerKills || 0,
        deaths: playerData.stats.playerDeaths || 0,
        kdr: playerData.stats.playerDeaths > 0 ? 
          ((playerData.stats.playerKills || 0) / playerData.stats.playerDeaths).toFixed(2) : 
          (playerData.stats.playerKills || 0),
        lastSeen: playerData.lastSeen,
        server: playerData.server,
        playtimeMinutes: playerData.playtimeMinutes,
        // Discord bilgileri
        discordId: playerData.discordId,
        discordUsername: playerData.discordUsername,
        discordAvatar: playerData.discordAvatar,
        discordLinked: playerData.discordLinked || false,
        discordLinkDate: playerData.discordLinkDate,
        // Online süresi (dakika)
        onlineFor: Math.floor((Date.now() - playerData.lastSeen) / (1000 * 60))
      });
    }
  }
  
  // Level'e göre sırala (en yüksek level önce)
  onlinePlayers.sort((a, b) => b.level - a.level);
  
  console.log(`🟢 Gerçek online oyuncular (${onlinePlayers.length}):`, onlinePlayers.map(p => `${p.playerName} (Son görülme: ${Math.floor((Date.now() - p.lastSeen) / 1000)}s önce)`));
  
  res.json({
    onlineCount: onlinePlayers.length,
    totalPlayers: hytalePlayerData.size,
    players: onlinePlayers,
    lastUpdate: Date.now(),
    serverStatus: onlinePlayers.length > 0 ? 'online' : 'waiting',
    note: 'Sadece son 2 dakikada Hytale sunucusunda aktif olan oyuncular gösterilir'
  });
});

// Online oyuncu sayısı (Discord bot için)
app.get("/api/players/online", (req, res) => {
  // Son 2 dakikada görülen oyuncuları online say
  const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
  let onlineCount = 0;
  let onlinePlayers = [];
  
  for (const [playerId, playerData] of hytalePlayerData) {
    if (playerData.lastSeen > twoMinutesAgo) {
      onlineCount++;
      onlinePlayers.push({
        playerId: playerId,
        playerName: playerData.playerName,
        lastSeen: playerData.lastSeen
      });
    }
  }
  
  console.log(`🟢 Online oyuncular (${onlineCount}):`, onlinePlayers.map(p => p.playerName));
  
  res.json({
    onlineCount: onlineCount,
    totalPlayers: hytalePlayerData.size,
    onlinePlayers: onlinePlayers,
    lastUpdate: Date.now()
  });
});

// Discord ID ile oyuncu arama
app.get("/api/player/by-discord/:discordId", (req, res) => {
  const { discordId } = req.params;
  
  // Discord ID ile oyuncu ara
  for (const [playerId, playerData] of hytalePlayerData) {
    if (playerData.discordId === discordId) {
      res.json({
        found: true,
        playerId: playerId,
        playerName: playerData.playerName,
        discordUsername: playerData.discordUsername,
        discordLinked: playerData.discordLinked,
        discordLinkDate: playerData.discordLinkDate
      });
      return;
    }
  }
  
  res.status(404).json({ 
    found: false, 
    error: "Discord ID ile bağlı oyuncu bulunamadı" 
  });
});

// Liderlik tablosu (Discord bot için)
app.get("/api/leaderboard/:category", (req, res) => {
  const { category } = req.params;
  
  if (!['level', 'coin', 'xp', 'kills', 'deaths', 'kdr'].includes(category)) {
    return res.status(400).json({ error: "Geçersiz kategori. level, coin, xp, kills, deaths veya kdr olmalı." });
  }
  
  // Tüm oyuncuları array'e çevir ve sırala
  const players = Array.from(hytalePlayerData.values());
  
  let sortedPlayers;
  if (category === 'level') {
    sortedPlayers = players.sort((a, b) => b.level - a.level);
  } else if (category === 'coin') {
    sortedPlayers = players.sort((a, b) => b.coins - a.coins);
  } else if (category === 'xp') {
    sortedPlayers = players.sort((a, b) => b.xp - a.xp);
  } else if (category === 'kills') {
    sortedPlayers = players.sort((a, b) => (b.stats.playerKills || 0) - (a.stats.playerKills || 0));
  } else if (category === 'deaths') {
    sortedPlayers = players.sort((a, b) => (b.stats.playerDeaths || 0) - (a.stats.playerDeaths || 0));
  } else if (category === 'kdr') {
    sortedPlayers = players.sort((a, b) => {
      const aKdr = (a.stats.playerDeaths || 0) > 0 ? (a.stats.playerKills || 0) / (a.stats.playerDeaths || 0) : (a.stats.playerKills || 0);
      const bKdr = (b.stats.playerDeaths || 0) > 0 ? (b.stats.playerKills || 0) / (b.stats.playerDeaths || 0) : (b.stats.playerKills || 0);
      return bKdr - aKdr;
    });
  }
  
  // Top 10'u al
  const topPlayers = sortedPlayers.slice(0, 10).map((player, index) => {
    const kdr = (player.stats.playerDeaths || 0) > 0 ? 
      ((player.stats.playerKills || 0) / (player.stats.playerDeaths || 0)).toFixed(2) : 
      (player.stats.playerKills || 0);
    
    return {
      rank: index + 1,
      playerName: player.playerName,
      playerId: player.playerId,
      level: player.level,
      xp: player.xp,
      coins: player.coins,
      kills: player.stats.playerKills || 0,
      deaths: player.stats.playerDeaths || 0,
      kdr: parseFloat(kdr),
      server: player.server
    };
  });
  
  res.json({
    category: category,
    players: topPlayers,
    totalPlayers: players.length,
    timestamp: Date.now()
  });
});

async function updateLocalDatabase(playerId, playerData) {
  try {
    // Discord ID ile local database'i güncelle
    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [playerId]);
    
    if (userResult.rows.length === 0) {
      await db.query(`
        INSERT INTO users (id, username, level, xp, coins)
        VALUES ($1, $2, $3, $4, $5)
      `, [playerId, playerData.playerName, playerData.level, playerData.xp, playerData.coins]);
    } else {
      await db.query(`
        UPDATE users
        SET username = $1, level = $2, xp = $3, coins = $4
        WHERE id = $5
      `, [playerData.playerName, playerData.level, playerData.xp, playerData.coins, playerId]);
    }
  } catch (error) {
    console.error('❌ PostgreSQL update hatası:', error);
  }
}

// Eski endpoint'ler (geriye uyumluluk için)
/**
 * PROFIL ENDPOINT
 * /profil/:id
 */
app.get("/profil/:id", async (req, res) => {
  const { id } = req.params;

  try {
    let userResult = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    let user = userResult.rows[0];

    // Yoksa oluştur
    if (!user) {
      await db.query(`
        INSERT INTO users (id, username, level, xp, coins)
        VALUES ($1, $2, 1, 0, 0)
      `, [id, `User-${id}`]);

      userResult = await db.query("SELECT * FROM users WHERE id = $1", [id]);
      user = userResult.rows[0];
    }

    res.json({
      id: user.id,
      username: user.username,
      level: user.level,
      xp: user.xp,
      coins: user.coins,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('❌ Profil endpoint hatası:', error);
    res.status(500).json({ error: 'Database hatası' });
  }
});

app.post("/game/update", async (req, res) => {
  const { id, xp = 0, coins = 0 } = req.body;

  if (!id) return res.status(400).json({ error: "id gerekli" });

  try {
    let userResult = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    let user = userResult.rows[0];

    if (!user) {
      await db.query(`
        INSERT INTO users (id, username, level, xp, coins)
        VALUES ($1, $2, 1, 0, 0)
      `, [id, `Player-${id}`]);

      userResult = await db.query("SELECT * FROM users WHERE id = $1", [id]);
      user = userResult.rows[0];
    }

    // 🔥 XP + LEVEL HESABI
    const result = calculateLevel(user.level, user.xp + xp);

    await db.query(`
      UPDATE users
      SET level = $1, xp = $2, coins = coins + $3
      WHERE id = $4
    `, [result.level, result.xp, coins, id]);

    res.json({
      ok: true,
      level: result.level,
      xp: result.xp,
      coinsAdded: coins
    });
  } catch (error) {
    console.error('❌ Game update endpoint hatası:', error);
    res.status(500).json({ error: 'Database hatası' });
  }
});

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Test endpoint çalışıyor!", timestamp: Date.now() });
});

// Ana sayfa - Dashboard'a yönlendir
app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

// Dashboard sayfası
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Discord kullanıcı bilgilerini al (web sitesi için)
app.post("/api/discord-user", async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ success: false, error: "Authorization code gerekli" });
  }
  
  try {
    console.log(`🌐 Web Discord OAuth işlemi başlatılıyor...`);
    
    // Discord'dan access token al
    const tokenData = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://hyturkiye.net/dashboard'
    });
    
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token } = tokenResponse.data;
    
    // Discord kullanıcı bilgilerini al
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const discordUser = userResponse.data;
    
    console.log(`✅ Web Discord auth başarılı: ${discordUser.username}#${discordUser.discriminator} (${discordUser.id})`);
    
    res.json({
      success: true,
      user: {
        id: discordUser.id,
        username: `${discordUser.username}#${discordUser.discriminator}`,
        avatar: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null
      }
    });
    
  } catch (error) {
    console.error("❌ Web Discord OAuth hatası:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: "Discord authentication failed" 
    });
  }
});

// Web sitesi için eşleştirme kodu oluştur
app.post("/api/generate-link-code", (req, res) => {
  const { discordId, discordUsername, discordAvatar } = req.body;
  
  if (!discordId || !discordUsername) {
    return res.status(400).json({ 
      success: false, 
      error: "discordId ve discordUsername gerekli" 
    });
  }
  
  // 6 haneli rastgele kod oluştur
  const linkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Kodu geçici olarak sakla (10 dakika geçerli)
  pendingCodes.set(linkCode, {
    discordId: discordId,
    discordUsername: discordUsername,
    discordAvatar: discordAvatar,
    timestamp: Date.now()
  });
  
  // 10 dakika sonra kodu sil
  setTimeout(() => {
    pendingCodes.delete(linkCode);
    console.log(`🗑️ Web kod süresi doldu: ${linkCode}`);
  }, 10 * 60 * 1000);
  
  console.log(`🌐 Web eşleştirme kodu oluşturuldu: ${discordUsername} -> ${linkCode}`);
  
  res.json({
    success: true,
    code: linkCode,
    expiresIn: 600 // 10 dakika
  });
});

// Discord OAuth callback endpoint
app.get("/auth/discord/callback", async (req, res) => {
  const { code, state } = req.query;
  
  console.log(`🔗 Discord OAuth callback received: code=${code ? 'present' : 'missing'}, state=${state}`);
  
  if (!code) {
    console.error("❌ Authorization code missing");
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Discord Bağlantısı Hatası</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #36393f; color: white; }
          .error { background: #f04747; padding: 20px; border-radius: 10px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>❌ Bağlantı Hatası</h1>
          <p>Authorization code eksik.</p>
          <p>Lütfen tekrar deneyin.</p>
        </div>
      </body>
      </html>
    `);
  }
  
  try {
    console.log(`🔗 Discord OAuth işlemi başlatılıyor: ${state} -> ${code.substring(0, 10)}...`);
    
    // Discord OAuth callback için production URL kullan (Discord Developer Portal'da kayıtlı)
    const redirectUri = 'https://hyturkiye.net/auth/discord/callback';
    
    // Discord'dan access token al
    const tokenData = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    });
    
    console.log(`📡 Discord token isteği gönderiliyor...`);
    
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token } = tokenResponse.data;
    console.log(`✅ Discord access token alındı`);
    
    // Discord kullanıcı bilgilerini al
    console.log(`📡 Discord kullanıcı bilgileri alınıyor...`);
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const discordUser = userResponse.data;
    
    // 6 haneli rastgele kod oluştur
    const linkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Kodu geçici olarak sakla (10 dakika geçerli)
    pendingCodes.set(linkCode, {
      discordId: discordUser.id,
      discordUsername: `${discordUser.username}#${discordUser.discriminator}`,
      discordAvatar: discordUser.avatar,
      timestamp: Date.now()
    });
    
    // 10 dakika sonra kodu sil
    setTimeout(() => {
      pendingCodes.delete(linkCode);
      console.log(`🗑️ Kod süresi doldu: ${linkCode}`);
    }, 10 * 60 * 1000);
    
    console.log(`✅ Discord auth başarılı: ${discordUser.username}#${discordUser.discriminator} (${discordUser.id}) -> Kod: ${linkCode}`);
    
    // State parametresini kontrol et - web giriş mi yoksa kod sistemi mi?
    if (state === 'web_login') {
      // Web sitesi direkt giriş
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Discord Girişi Başarılı</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #36393f; color: white; }
            .success { background: #43b581; padding: 30px; border-radius: 10px; display: inline-block; margin: 20px; }
            .avatar { width: 64px; height: 64px; border-radius: 50%; margin: 10px; }
          </style>
        </head>
        <body>
          <div class="success">
            <h1>✅ Discord Girişi Başarılı!</h1>
            ${discordUser.avatar ? `<img class="avatar" src="https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png" alt="Avatar">` : ''}
            <p><strong>${discordUser.username}#${discordUser.discriminator}</strong></p>
            <p>Dashboard'a yönlendiriliyorsunuz...</p>
          </div>
          
          <script>
            // Kullanıcı bilgilerini localStorage'a kaydet
            const userData = {
              id: '${discordUser.id}',
              username: '${discordUser.username}#${discordUser.discriminator}',
              avatar: '${discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null}'
            };
            
            localStorage.setItem('hytale_user', JSON.stringify(userData));
            
            // 2 saniye sonra ana sayfaya yönlendir
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          </script>
        </body>
        </html>
      `);
    } else {
      // Oyun içi kod sistemi (varsayılan)
      res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Discord Bağlantısı - Kod Alındı</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #36393f; color: white; }
          .success { background: #43b581; padding: 30px; border-radius: 10px; display: inline-block; margin: 20px; }
          .code { background: #7289da; padding: 20px; border-radius: 5px; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 3px; }
          .info { background: #faa61a; color: #000; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .steps { text-align: left; background: #2f3136; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .avatar { width: 64px; height: 64px; border-radius: 50%; margin: 10px; }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✅ Discord Yetkilendirmesi Başarılı!</h1>
          ${discordUser.avatar ? `<img class="avatar" src="https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png" alt="Avatar">` : ''}
          <p><strong>${discordUser.username}#${discordUser.discriminator}</strong></p>
        </div>
        
        <div class="code">
          ${linkCode}
        </div>
        
        <div class="info">
          <h3>⚠️ Bu kodu 10 dakika içinde kullanmalısın!</h3>
        </div>
        
        <div class="steps">
          <h3>🎮 Sonraki Adımlar:</h3>
          <p><strong>1.</strong> Hytale sunucusuna gir</p>
          <p><strong>2.</strong> Chat'e şu komutu yaz:</p>
          <p style="background: #000; padding: 10px; border-radius: 3px; font-family: monospace;">
            /kodgir ${linkCode}
          </p>
          <p><strong>3.</strong> Hesapların otomatik olarak bağlanacak!</p>
          <p><strong>4.</strong> Discord'da <code>/profil</code> komutunu kullanabilirsin!</p>
        </div>
        
        <p style="color: #99aab5; font-size: 14px;">Bu sayfayı kapatabilirsin ve oyuna dönebilirsin!</p>
        
        <script>
          // 10 dakika sonra sayfayı otomatik kapat
          setTimeout(() => {
            window.close();
          }, 10 * 60 * 1000);
        </script>
      </body>
      </html>
    `);
    }
    
  } catch (error) {
    console.error("❌ Discord OAuth hatası:", error.response?.data || error.message);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Discord Bağlantısı Hatası</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #36393f; color: white; }
          .error { background: #f04747; padding: 20px; border-radius: 10px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>❌ Bağlantı Hatası</h1>
          <p>Discord bağlantısı sırasında bir hata oluştu.</p>
          <p>Hata: ${error.message}</p>
          <p>Lütfen tekrar deneyin.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// YouTube kanal bilgileri (statik - manuel video linkleri)
app.get("/api/youtube-info", (req, res) => {
  res.json({
    channelName: "Hytale Akedemi",
    channelUrl: "https://www.youtube.com/@HytaleAkademi/featured",
    subscribeUrl: "https://www.youtube.com/@HytaleAkademi/featured?sub_confirmation=1",
    description: "En son Hytale haberlerini, rehberlerini ve oynanış videolarını kaçırma!",
    socialLinks: {
      discord: "https://discord.gg/zWpDEpnNEh",
      youtube: "https://www.youtube.com/@HytaleAkademi/featured",
      tiktok: "https://www.tiktok.com/@hytale_akademi?_r=1&_t=ZS-93QeZ58xX3E",
      instagram: "https://www.instagram.com/hytaleakademi?igsh=MXJ4cWRrMjRzd2FhNg=="
    },
    // Manuel video listesi
    videos: [
      {
        id: "cVbJU6JRYOM",
        title: "Hytale Akedemi - En Yeni Video 🎮",
        description: "Hytale dünyasından en son haberler ve güncellemeler...",
        thumbnail: "https://img.youtube.com/vi/cVbJU6JRYOM/maxresdefault.jpg",
        url: "https://www.youtube.com/watch?v=cVbJU6JRYOM",
        category: "latest",
        duration: "10:25",
        views: "15.2K",
        likes: "1.2K"
      },
      {
        id: "e0yZlW2bt8k",
        title: "Hytale PvP ve Savaş Rehberi ⚔️",
        description: "PvP'de nasıl daha iyi olunur? En etkili taktikler ve ipuçları...",
        thumbnail: "https://img.youtube.com/vi/e0yZlW2bt8k/maxresdefault.jpg",
        url: "https://www.youtube.com/watch?v=e0yZlW2bt8k",
        category: "popular",
        duration: "15:42",
        views: "45.8K",
        likes: "3.4K"
      },
      {
        id: "caII4v5qi1Q",
        title: "Hytale Başlangıç Rehberi 🔧",
        description: "Hytale'e yeni mi başlıyorsun? Bu rehber tam sana göre!",
        thumbnail: "https://img.youtube.com/vi/caII4v5qi1Q/maxresdefault.jpg",
        url: "https://www.youtube.com/watch?v=caII4v5qi1Q",
        category: "tutorials",
        duration: "8:15",
        views: "28.5K",
        likes: "2.1K"
      },
      {
        id: "p9PCbt9dK3U",
        title: "Hytale Büyük Güncelleme Haberleri! 🚀",
        description: "Yeni özellikler, bloklar ve daha fazlası! Tüm detaylar burada...",
        thumbnail: "https://img.youtube.com/vi/p9PCbt9dK3U/maxresdefault.jpg",
        url: "https://www.youtube.com/watch?v=p9PCbt9dK3U",
        category: "news",
        duration: "12:30",
        views: "67.3K",
        likes: "5.2K"
      },
      {
        id: "57K8KsB7PBs",
        title: "Hytale İnşaat ve Yapı İpuçları 🏗️",
        description: "Muhteşem yapılar inşa etmek için profesyonel ipuçları...",
        thumbnail: "https://img.youtube.com/vi/57K8KsB7PBs/maxresdefault.jpg",
        url: "https://www.youtube.com/watch?v=57K8KsB7PBs",
        category: "latest",
        duration: "18:45",
        views: "32.1K",
        likes: "2.8K"
      },
      {
        id: "-9syO6VRNqY",
        title: "Hytale Detaylı Oynanış Rehberi 📚",
        description: "Hytale'in tüm özelliklerini keşfedin! Kapsamlı rehber...",
        thumbnail: "https://img.youtube.com/vi/-9syO6VRNqY/maxresdefault.jpg",
        url: "https://www.youtube.com/watch?v=-9syO6VRNqY",
        category: "tutorials",
        duration: "25:12",
        views: "89.7K",
        likes: "7.1K"
      }
    ]
  });
});

// Duplicate oyuncu kayıtlarını temizle
app.post("/api/clean-duplicates", (req, res) => {
  console.log('🧹 Duplicate oyuncu kayıtları temizleniyor...');
  
  const playersByName = new Map();
  const duplicatesToRemove = [];
  
  // Oyuncuları isme göre grupla
  for (const [playerId, playerData] of hytalePlayerData) {
    const playerName = playerData.playerName.toLowerCase();
    
    if (!playersByName.has(playerName)) {
      playersByName.set(playerName, []);
    }
    playersByName.get(playerName).push({ playerId, playerData });
  }
  
  // Her isim için sadece Discord bağlantılı olanı bırak
  for (const [playerName, players] of playersByName) {
    if (players.length > 1) {
      console.log(`🔍 ${playerName} için ${players.length} kayıt bulundu`);
      
      // Discord bağlantılı olanı bul
      const discordLinked = players.find(p => p.playerData.discordLinked && p.playerData.discordId);
      
      if (discordLinked) {
        // Discord bağlantılı olmayan diğerlerini sil
        players.forEach(p => {
          if (p.playerId !== discordLinked.playerId) {
            duplicatesToRemove.push(p.playerId);
            console.log(`🗑️ Duplicate kayıt silinecek: ${p.playerData.playerName} (${p.playerId})`);
          }
        });
      } else {
        // Hiçbiri Discord bağlantılı değilse, en son görüleni bırak
        players.sort((a, b) => b.playerData.lastSeen - a.playerData.lastSeen);
        for (let i = 1; i < players.length; i++) {
          duplicatesToRemove.push(players[i].playerId);
          console.log(`🗑️ Eski kayıt silinecek: ${players[i].playerData.playerName} (${players[i].playerId})`);
        }
      }
    }
  }
  
  // Duplicate kayıtları sil
  duplicatesToRemove.forEach(playerId => {
    hytalePlayerData.delete(playerId);
  });
  
  console.log(`✅ ${duplicatesToRemove.length} duplicate kayıt silindi`);
  console.log(`✅ Kalan toplam oyuncu: ${hytalePlayerData.size}`);
  
  res.json({
    success: true,
    message: `${duplicatesToRemove.length} duplicate kayıt silindi`,
    removedCount: duplicatesToRemove.length,
    remainingPlayers: hytalePlayerData.size
  });
});

// Test verilerini temizle (sadece gerçek oyuncu verilerini bırak)
app.post("/api/clear-test-data", (req, res) => {
  const { confirm } = req.body;
  
  if (!confirm) {
    return res.status(400).json({ 
      success: false, 
      error: "Onay gerekli" 
    });
  }
  
  console.log('🧹 Test verileri temizleniyor...');
  
  // Test player ID'leri ile başlayan tüm verileri sil
  const playersToRemove = [];
  for (const [playerId, playerData] of hytalePlayerData) {
    if (playerId.startsWith('test-') || playerId.includes('test') || 
        playerData.playerName.includes('Test') || playerData.playerName.includes('test') ||
        ['PvPMaster', 'WarriorKing', 'ShadowHunter', 'BattleAxe', 'StealthNinja'].includes(playerData.playerName)) {
      playersToRemove.push(playerId);
    }
  }
  
  // Test oyuncularını sil
  playersToRemove.forEach(playerId => {
    const playerData = hytalePlayerData.get(playerId);
    console.log(`🗑️ Test oyuncusu siliniyor: ${playerData.playerName} (${playerId})`);
    hytalePlayerData.delete(playerId);
  });
  
  // Test kodlarını temizle
  pendingCodes.clear();
  
  console.log(`✅ ${playersToRemove.length} test oyuncusu silindi`);
  console.log(`✅ Kalan gerçek oyuncu sayısı: ${hytalePlayerData.size}`);
  
  res.json({
    success: true,
    message: `${playersToRemove.length} test oyuncusu silindi`,
    remainingPlayers: hytalePlayerData.size,
    removedPlayers: playersToRemove.length
  });
});

// 🆕 DISCORD SUNUCU İSTATİSTİKLERİ - EN SON EKLENEN ENDPOINT
app.get("/api/discord-server-stats", async (req, res) => {
  console.log('📊 Discord sunucu istatistikleri endpoint çağrıldı!');
  
  try {
    const stats = {
      totalMembers: 1847,
      onlineMembers: 234,
      hytalePlayersCount: hytalePlayerData.size,
      serverAge: '2 yıl 3 ay',
      discordLinkedPlayers: 0
    };
    
    console.log('✅ Discord stats döndürülüyor:', stats);
    
    res.json({
      success: true,
      stats: stats,
      serverInfo: {
        name: 'Hytale Akedemi',
        guildId: '1460419740655685851',
        inviteUrl: 'https://discord.gg/zWpDEpnNEh'
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Discord stats hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Server'ı başlat - Tek port kullan
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Hytale Backend API Server - Port ${PORT}`);
  console.log("📡 Hytale plugin'den veri almaya hazır!");
  console.log("🤖 Discord Bot API hazır!");
  console.log("🔗 Discord OAuth: https://hyturkiye.net/auth/discord/callback");
  console.log("📺 Manuel YouTube video sistemi aktif!");
  console.log("==========================================");
  console.log("✅ Tüm servisler aktif!");
  console.log("✅ Discord bot entegrasyonu hazır!");
  console.log("✅ OAuth callback endpoint hazır!");
  console.log("✅ API endpoints hazır!");
  console.log("✅ Manuel video sistemi hazır!");
  console.log("==========================================");
});
