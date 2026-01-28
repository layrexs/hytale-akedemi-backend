// Manuel oyuncu senkronizasyonu - Discord ID ile
const axios = require('axios');

async function syncPlayer(playerName, discordId) {
    console.log(`🔄 ${playerName} senkronize ediliyor... (Discord ID: ${discordId})`);
    
    try {
        // 1. Oyuncu join eventi
        const joinData = {
            player: playerName,
            action: "join",
            data: {
                playerId: discordId, // Discord ID kullan
                timestamp: Date.now(),
                server: "hytale-server-1",
                loginCount: 1
            }
        };
        
        const joinResponse = await axios.post('http://localhost:8080/api/player-action', joinData);
        console.log("✅ Join verisi gönderildi:", joinResponse.data);
        
        // 2. Aktif durumu güncelle (son görülme zamanı)
        const updateData = {
            player: playerName,
            action: "join", // Tekrar join göndererek lastSeen'i güncelle
            data: {
                playerId: discordId,
                timestamp: Date.now(),
                server: "hytale-server-1",
                loginCount: 1
            }
        };
        
        const updateResponse = await axios.post('http://localhost:8080/api/player-action', updateData);
        console.log("✅ Aktif durum güncellendi:", updateResponse.data);
        
        // 3. Test kill'leri ekle
        const killData = {
            player: playerName,
            action: "kill",
            data: {
                playerId: discordId,
                mobType: "skeleton",
                location: "Senkronizasyon Testi",
                timestamp: Date.now(),
                server: "hytale-server-1"
            }
        };
        
        const killResponse = await axios.post('http://localhost:8080/api/player-action', killData);
        console.log("✅ Kill verisi gönderildi:", killResponse.data);
        
        // 4. Oynama süresi ekle
        const leaveData = {
            player: playerName,
            action: "leave",
            data: {
                playerId: discordId,
                playTimeMinutes: 1, // 1 dakika oynama süresi
                timestamp: Date.now(),
                server: "hytale-server-1"
            }
        };
        
        const leaveResponse = await axios.post('http://localhost:8080/api/player-action', leaveData);
        console.log("✅ Oynama süresi gönderildi:", leaveResponse.data);
        
        // 5. Tekrar aktif yap (online göstermek için)
        const finalJoinData = {
            player: playerName,
            action: "join",
            data: {
                playerId: discordId,
                timestamp: Date.now(),
                server: "hytale-server-1",
                loginCount: 2
            }
        };
        
        const finalResponse = await axios.post('http://localhost:8080/api/player-action', finalJoinData);
        console.log("✅ Final aktif durum:", finalResponse.data);
        
        console.log(`🎉 ${playerName} başarıyla senkronize edildi!`);
        console.log(`💡 Discord'da '/profil' komutunu dene!`);
        console.log(`💡 Discord'da '/stats' komutunu dene!`);
        
    } catch (error) {
        console.error("❌ Senkronizasyon hatası:", error.message);
    }
}

// Kullanım: node sync-player.js
// Script'i çalıştırdığında kendi bilgilerini gir
const playerName = process.argv[2] || "TestOyuncu";
const discordId = process.argv[3] || "123456789"; // Kendi Discord ID'ni buraya yaz

console.log("🚀 Manuel Oyuncu Senkronizasyonu");
console.log("================================");
console.log(`Oyuncu: ${playerName}`);
console.log(`Discord ID: ${discordId}`);
console.log("================================");

syncPlayer(playerName, discordId);