/*
 * Hytale Akedemi Discord Bot
 * Copyright (c) 2026 Hytale Akedemi. All rights reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * Contact: info@hytaleakedemi.com
 */

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

// 🏠 SUNUCU KONFIGÜRASYONU
const GUILD_ID = process.env.DISCORD_GUILD_ID || "1460419740655685851";
const SERVER_NAME = "Hytale Akedemi";
const SERVER_LOGO = "https://cdn.discordapp.com/attachments/1464267831154704610/1464532801603895468/image.png?ex=6979c475&is=697872f5&hm=cb1f967aa8344759e43ba6b65422f811f238131352112b5e91e98b3864105493&";
const BACKEND_URL = "https://hyturkiye.net";

console.log(`🏠 Discord Sunucu ID: ${GUILD_ID}`);
console.log(`🏠 Sunucu Adı: ${SERVER_NAME}`);
console.log(`🏠 Backend URL: ${BACKEND_URL}`);

// 🎨 ÖZEL EMOJİ KONFIGÜRASYONU
const CUSTOM_EMOJIS = {
  level: "<a:loadinggreenbar:1465691557691785330>",
  xp: "<:minecraft_xp:1465692312406462495>",
  coin: "<:coins15:1465691403698045093>",
  online: "<:yesil:1464338918492209348>",
  offline: "<:kirmizi:1464339186742984798>",
  server: "<:ev:1464354603687477268>",
  time: "<:time:1465691704479842315>",
  calendar: "<:dias:1465691494802264114>",
  stats: "<:Skill_Stats_icon56:1465691675879014491>",
  trophy: "<:toper:1465691740177436824>",
  fire: "<:lv75:1464343323480424661>",
  warning: "<:Rules_Warning1:1465691585596620882>",
  error: "<:Error_:1465691519259246682>",
  success: "<:shield_success:1465691647957270614>",
  info: "<:info:1465691380570390686>",
  // PvP Emojileri - Kendi emojilerini buraya ekleyebilirsin
  kill: "<:savasci:1464353797211033661>",           // PvP Kill emoji
  death: "<:kurukafa:1464339049564209152>",          // PvP Death emoji
  kdr: "<:Skill_Stats_icon56:1465691675879014491>"             // K/D Ratio emoji
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 🔹 SLASH KOMUT TANIMI
const commands = [
  new SlashCommandBuilder()
    .setName("profil")
    .setDescription("Oyun içi profilini gösterir")
    .addStringOption(option =>
      option.setName("oyuncu")
        .setDescription("Oyuncu adı (boş bırakırsan kendi profilin)")
        .setRequired(false)
    ),
  
  new SlashCommandBuilder()
    .setName("coin")
    .setDescription("Coin bilgilerini gösterir")
    .addStringOption(option =>
      option.setName("oyuncu")
        .setDescription("Oyuncu adı (boş bırakırsan kendi coin'in)")
        .setRequired(false)
    ),
    
  new SlashCommandBuilder()
    .setName("level")
    .setDescription("Level bilgilerini gösterir")
    .addStringOption(option =>
      option.setName("oyuncu")
        .setDescription("Oyuncu adı (boş bırakırsan kendi level'in)")
        .setRequired(false)
    ),
    
  new SlashCommandBuilder()
    .setName("sunucu")
    .setDescription("Hytale sunucu bilgilerini gösterir"),
    
  new SlashCommandBuilder()
    .setName("top")
    .setDescription("En yüksek seviyeli oyuncuları gösterir")
    .addStringOption(option =>
      option.setName("kategori")
        .setDescription("Hangi kategoride sıralama yapılacak")
        .setRequired(false)
        .addChoices(
          { name: 'Level', value: 'level' },
          { name: 'Coin', value: 'coin' },
          { name: 'XP', value: 'xp' },
          { name: 'Kill', value: 'kills' },
          { name: 'Ölüm', value: 'deaths' },
          { name: 'K/D Oranı', value: 'kdr' }
        )
    ),
    
  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Detaylı oyuncu istatistiklerini gösterir")
    .addStringOption(option =>
      option.setName("oyuncu")
        .setDescription("Oyuncu adı (boş bırakırsan kendi stats'in)")
        .setRequired(false)
    ),
    
  new SlashCommandBuilder()
    .setName("yardım")
    .setDescription("Tüm bot komutlarını ve kullanım bilgilerini gösterir")
];

// 🔹 KOMUTLARI KAYDET
async function deployCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  
  try {
    console.log("🔁 Slash komutlar yükleniyor...");
    console.log(`📝 ${commands.length} komut kayıt ediliyor...`);
    
    // Eski komutları temizle
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID), { body: [] });
    console.log("🗑️ Eski komutlar temizlendi");
    
    // Yeni komutları kaydet
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID), { body: commands });
    
    console.log("✅ Slash komutlar yüklendi");
    commands.forEach(cmd => {
      console.log(`   - /${cmd.name}: ${cmd.description}`);
    });
  } catch (error) {
    console.error("❌ Komut yükleme hatası:", error);
  }
}

// 🔹 BOT HAZIR OLDUĞUNDA
client.once("ready", () => {
  console.log(`🤖 Bot hazır: ${client.user.tag}`);
  
  // Bot'un aktivite durumunu ayarla
  client.user.setActivity('Youtube: Hytale Akedemi', { 
    type: 0 // PLAYING activity type
  });
  
  console.log(`🎮 Bot aktivitesi ayarlandı: "Youtube: Hytale Akedemi" oynuyor`);
  
  deployCommands();
});

// 🔹 SLASH KOMUT ÇALIŞINCA
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const targetPlayer = interaction.options.getString("oyuncu");
  const userId = interaction.user.id;
  
  // Oyuncu ID'sini belirle
  let playerId = targetPlayer || userId;
  let playerName = targetPlayer || interaction.user.username;

  if (interaction.commandName === "profil") {
    try {
      console.log(`Profil sorgusu: ${playerName} (Discord ID: ${userId})`);
      
      // Önce Discord ID ile oyuncu bul
      const playerRes = await axios.get(`${BACKEND_URL}/api/player/by-discord/${userId}`);
      const playerInfo = playerRes.data.player;
      const actualPlayerId = playerInfo.playerId;
      
      console.log(`Oyuncu bulundu: ${playerInfo.playerName} (Player ID: ${actualPlayerId})`);
      
      // Backend'den profil ve stats bilgilerini al
      const [profileRes, statsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/player/profile/${actualPlayerId}`),
        axios.get(`${BACKEND_URL}/api/player/stats/${actualPlayerId}`)
      ]);
      
      const profile = profileRes.data;
      const stats = statsRes.data;
      
      // Katılma tarihi formatla
      const joinDate = new Date(profile.joinDate);
      const joinDateStr = joinDate.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Online durumu kontrol et
      const onlineStatus = profile.isOnline ? 
        `${CUSTOM_EMOJIS.online} **Çevrimiçi**` : 
        `${CUSTOM_EMOJIS.offline} **Çevrimdışı**`;
      
      const profileEmbed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle(`${CUSTOM_EMOJIS.info} ${profile.playerName} - Oyuncu Profili`)
        .setThumbnail(SERVER_LOGO)
        .addFields(
          { name: `${CUSTOM_EMOJIS.level} Level`, value: `**${profile.level}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.xp} XP`, value: `**${profile.xp.toLocaleString('tr-TR')}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.coin} Coin`, value: `**${profile.totalCoins.toLocaleString('tr-TR')}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.kill} PvP Kill`, value: `**${stats.kills}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.death} PvP Ölüm`, value: `**${stats.deaths}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.kdr} K/D Oranı`, value: `**${stats.kdr}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.server} Durum`, value: onlineStatus, inline: true },
          { name: `${CUSTOM_EMOJIS.calendar} Katılma Tarihi`, value: joinDateStr, inline: true },
          { name: `${CUSTOM_EMOJIS.time} Oynama Süresi`, value: `**${profile.playtimeMinutes} dakika**`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `${SERVER_NAME} • Oyuncu Profili`, iconURL: SERVER_LOGO });

      await interaction.reply({
        embeds: [profileEmbed],
        ephemeral: true
      });
      
    } catch (err) {
      console.error("Profil hatası:", err.message);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`${CUSTOM_EMOJIS.error} Oyuncu Bulunamadı`)
        .setDescription(`**${playerName}** adlı oyuncu bulunamadı veya henüz sunucuya katılmamış.`)
        .addFields(
          { name: '💡 Çözüm', value: 'Önce Hytale sunucusuna katılın ve biraz oynayın!' }
        )
        .setTimestamp()
        .setFooter({ text: SERVER_NAME, iconURL: SERVER_LOGO });

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }

  else if (interaction.commandName === "sunucu") {
    try {
      console.log("Sunucu bilgileri sorgusu");
      
      // Backend'den sunucu bilgilerini al
      const [serverRes, onlineRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/server-stats`),
        axios.get(`${BACKEND_URL}/api/players/online`)
      ]);
      
      const serverStats = serverRes.data;
      const onlineData = onlineRes.data;
      
      // Uptime formatla
      const uptimeHours = Math.floor(serverStats.serverUptime / 3600);
      const uptimeMinutes = Math.floor((serverStats.serverUptime % 3600) / 60);
      const uptimeStr = `${uptimeHours} saat ${uptimeMinutes} dakika`;
      
      // Online oyuncular listesi
      let onlinePlayersList = "Kimse çevrimiçi değil";
      if (onlineData.onlinePlayers && onlineData.onlinePlayers.length > 0) {
        onlinePlayersList = onlineData.onlinePlayers
          .map(p => `• **${p.playerName}**`)
          .join('\n');
      }
      
      const serverEmbed = new EmbedBuilder()
        .setColor(0x7289DA)
        .setTitle(`${CUSTOM_EMOJIS.server} ${SERVER_NAME} - Sunucu Bilgileri`)
        .setThumbnail(SERVER_LOGO)
        .addFields(
          { name: `${CUSTOM_EMOJIS.online} Çevrimiçi Oyuncular`, value: `**${onlineData.onlineCount}** / **${onlineData.totalPlayers}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.time} Sunucu Uptime`, value: uptimeStr, inline: true },
          { name: `${CUSTOM_EMOJIS.info} Durum`, value: `${CUSTOM_EMOJIS.success} **Aktif**`, inline: true },
          { name: '\u200B', value: '\u200B' },
          { name: `${CUSTOM_EMOJIS.trophy} Çevrimiçi Oyuncular`, value: onlinePlayersList, inline: false },
          { name: '\u200B', value: '\u200B' },
          { name: `${CUSTOM_EMOJIS.info} Sunucu Bilgileri`, value: `🌐 **Discord:** https://discord.gg/zWpDEpnNEh\n🎮 **Hytale Sunucu:** Aktif\n💬 **Discord Bot:** Çalışıyor`, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `${SERVER_NAME} • Sunucu Durumu`, iconURL: SERVER_LOGO });

      await interaction.reply({
        embeds: [serverEmbed],
        ephemeral: false // Sunucu bilgileri herkese görünür
      });
      
    } catch (err) {
      console.error("Sunucu bilgileri hatası:", err.message);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`${CUSTOM_EMOJIS.error} Sunucu Bilgileri Alınamadı`)
        .setDescription('Hytale sunucusu ile bağlantı kurulamadı.')
        .addFields(
          { name: '💡 Durum', value: 'Sunucu geçici olarak erişilemez durumda olabilir.' }
        )
        .setTimestamp()
        .setFooter({ text: SERVER_NAME, iconURL: SERVER_LOGO });

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }

  else if (interaction.commandName === "coin") {
    try {
      console.log(`Coin sorgusu: ${playerName} (ID: ${playerId})`);
      
      const coinRes = await axios.get(`${BACKEND_URL}/api/player/coins/${playerId}`);
      const coins = coinRes.data;
      
      const coinEmbed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(`${CUSTOM_EMOJIS.coin} ${coins.playerName} - Coin Bilgileri`)
        .setThumbnail(SERVER_LOGO)
        .addFields(
          { name: `${CUSTOM_EMOJIS.coin} Mevcut Coin`, value: `**${coins.coins.toLocaleString('tr-TR')}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.success} Toplam Kazanılan`, value: `**${coins.totalEarned.toLocaleString('tr-TR')}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.warning} Toplam Harcanan`, value: `**${coins.totalSpent.toLocaleString('tr-TR')}**`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `${SERVER_NAME} • Coin Bilgileri`, iconURL: SERVER_LOGO });

      if (coins.lastTransaction) {
        const transactionType = coins.lastTransaction.type === 'earn' ? 'Kazanım' : 'Harcama';
        const transactionEmoji = coins.lastTransaction.type === 'earn' ? CUSTOM_EMOJIS.success : CUSTOM_EMOJIS.warning;
        coinEmbed.addFields({
          name: `${transactionEmoji} Son İşlem`,
          value: `**${transactionType}:** ${coins.lastTransaction.amount} coin\n**Sebep:** ${coins.lastTransaction.reason}`,
          inline: false
        });
      }

      await interaction.reply({
        embeds: [coinEmbed],
        ephemeral: true
      });
      
    } catch (err) {
      console.error("Coin hatası:", err.message);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`${CUSTOM_EMOJIS.error} Coin Bilgileri Alınamadı`)
        .setDescription(`**${playerName}** için coin bilgileri bulunamadı.`)
        .setTimestamp()
        .setFooter({ text: SERVER_NAME, iconURL: SERVER_LOGO });

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }

  else if (interaction.commandName === "level") {
    try {
      console.log(`Level sorgusu: ${playerName} (ID: ${playerId})`);
      
      const levelRes = await axios.get(`${BACKEND_URL}/api/player/level/${playerId}`);
      const level = levelRes.data;
      
      const levelEmbed = new EmbedBuilder()
        .setColor(0x9932CC)
        .setTitle(`${CUSTOM_EMOJIS.level} ${level.playerName} - Level Bilgileri`)
        .setThumbnail(SERVER_LOGO)
        .addFields(
          { name: `${CUSTOM_EMOJIS.level} Mevcut Level`, value: `**${level.level}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.xp} Mevcut XP`, value: `**${level.currentXp.toLocaleString('tr-TR')}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.fire} Sonraki Level'e`, value: `**${level.xpToNextLevel.toLocaleString('tr-TR')} XP**`, inline: true },
          { name: `${CUSTOM_EMOJIS.trophy} Toplam XP`, value: `**${level.totalXp.toLocaleString('tr-TR')}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.info} İlerleme`, value: `**%${level.levelProgress.toFixed(1)}**`, inline: true },
          { name: '\u200B', value: '\u200B', inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `${SERVER_NAME} • Level Bilgileri`, iconURL: SERVER_LOGO });

      await interaction.reply({
        embeds: [levelEmbed],
        ephemeral: true
      });
      
    } catch (err) {
      console.error("Level hatası:", err.message);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`${CUSTOM_EMOJIS.error} Level Bilgileri Alınamadı`)
        .setDescription(`**${playerName}** için level bilgileri bulunamadı.`)
        .setTimestamp()
        .setFooter({ text: SERVER_NAME, iconURL: SERVER_LOGO });

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }

  else if (interaction.commandName === "top") {
    try {
      const category = interaction.options.getString("kategori") || "level";
      console.log(`Top listesi sorgusu: ${category}`);
      
      const topRes = await axios.get(`${BACKEND_URL}/api/leaderboard/${category}`);
      const leaderboard = topRes.data;
      
      const categoryNames = {
        'level': 'Level',
        'coin': 'Coin',
        'xp': 'XP',
        'kills': 'PvP Kill',
        'deaths': 'PvP Ölüm',
        'kdr': 'K/D Oranı'
      };
      
      const categoryEmojis = {
        'level': CUSTOM_EMOJIS.level,
        'coin': CUSTOM_EMOJIS.coin,
        'xp': CUSTOM_EMOJIS.xp,
        'kills': CUSTOM_EMOJIS.kill,
        'deaths': CUSTOM_EMOJIS.death,
        'kdr': CUSTOM_EMOJIS.kdr
      };
      
      let leaderboardText = '';
      leaderboard.players.forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
        let value;
        
        if (category === 'level') {
          value = player.level;
        } else if (category === 'coin') {
          value = player.coins.toLocaleString('tr-TR');
        } else if (category === 'xp') {
          value = player.xp.toLocaleString('tr-TR');
        } else if (category === 'kills') {
          value = player.kills;
        } else if (category === 'deaths') {
          value = player.deaths;
        } else if (category === 'kdr') {
          value = player.kdr;
        }
        
        leaderboardText += `${medal} **${player.playerName}** - ${value}\n`;
      });
      
      const topEmbed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(`${categoryEmojis[category]} ${categoryNames[category]} Liderlik Tablosu`)
        .setThumbnail(SERVER_LOGO)
        .setDescription(leaderboardText || 'Henüz veri yok')
        .addFields(
          { name: `${CUSTOM_EMOJIS.info} Bilgi`, value: `Toplam **${leaderboard.totalPlayers}** oyuncu`, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `${SERVER_NAME} • Liderlik Tablosu`, iconURL: SERVER_LOGO });

      await interaction.reply({
        embeds: [topEmbed],
        ephemeral: false
      });
      
    } catch (err) {
      console.error("Top listesi hatası:", err.message);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`${CUSTOM_EMOJIS.error} Liderlik Tablosu Alınamadı`)
        .setDescription('Liderlik tablosu verisi alınamadı.')
        .setTimestamp()
        .setFooter({ text: SERVER_NAME, iconURL: SERVER_LOGO });

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }

  else if (interaction.commandName === "stats") {
    try {
      console.log(`Stats sorgusu: ${playerName} (ID: ${playerId})`);
      
      const statsRes = await axios.get(`${BACKEND_URL}/api/player/stats/${playerId}`);
      const stats = statsRes.data;
      
      // PvP istatistikleri
      const pvpText = `${CUSTOM_EMOJIS.kill} **PvP Kill:** ${stats.kills}\n${CUSTOM_EMOJIS.death} **PvP Ölüm:** ${stats.deaths}\n${CUSTOM_EMOJIS.kdr} **K/D Oranı:** ${stats.kdr}`;
      
      // Son PvP killeri
      let recentKillsText = "Henüz PvP kill yok";
      if (stats.recentKills && stats.recentKills.length > 0) {
        recentKillsText = stats.recentKills
          .slice(0, 5) // Son 5 kill
          .map(kill => {
            const date = new Date(kill.timestamp).toLocaleDateString('tr-TR');
            const victimName = kill.victimName || 'Bilinmiyor';
            return `• **${victimName}** - ${date}`;
          })
          .join('\n');
      }
      
      const statsEmbed = new EmbedBuilder()
        .setColor(0x9932CC)
        .setTitle(`${CUSTOM_EMOJIS.stats} ${stats.playerName} - PvP İstatistikleri`)
        .setThumbnail(SERVER_LOGO)
        .addFields(
          { name: `${CUSTOM_EMOJIS.kill} PvP Savaş İstatistikleri`, value: pvpText, inline: true },
          { name: `${CUSTOM_EMOJIS.time} Oynama Süresi`, value: `**${stats.playtimeFormatted}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.trophy} Başarımlar`, value: `**${stats.achievements}**`, inline: true },
          { name: `${CUSTOM_EMOJIS.fire} Son PvP Kill'leri`, value: recentKillsText, inline: false },
          { name: `${CUSTOM_EMOJIS.info} XP Bilgisi`, value: `Sadece PvP kill'lerinden XP kazanılır!\n**PvP XP:** ${stats.xpSources.fromKills} XP`, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `${SERVER_NAME} • PvP İstatistikleri`, iconURL: SERVER_LOGO });

      await interaction.reply({
        embeds: [statsEmbed],
        ephemeral: true
      });
      
    } catch (err) {
      console.error("Stats hatası:", err.message);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`${CUSTOM_EMOJIS.error} İstatistikler Alınamadı`)
        .setDescription(`**${playerName}** için istatistikler bulunamadı.`)
        .addFields(
          { name: '💡 Çözüm', value: 'Oyunda biraz oynayın ve kill alın!' }
        )
        .setTimestamp()
        .setFooter({ text: SERVER_NAME, iconURL: SERVER_LOGO });

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }

  else if (interaction.commandName === "yardım") {
    try {
      console.log('Yardım komutu sorgusu');
      
      const helpEmbed = new EmbedBuilder()
        .setColor(0x7289DA)
        .setTitle(`${CUSTOM_EMOJIS.info} ${SERVER_NAME} - Bot Komutları`)
        .setThumbnail(SERVER_LOGO)
        .setDescription('Hytale sunucusu için kullanılabilir tüm Discord bot komutları:')
        .addFields(
          { 
            name: `${CUSTOM_EMOJIS.info} **Oyuncu Komutları**`, 
            value: `${CUSTOM_EMOJIS.level} \`/profil [oyuncu]\` - Oyuncu profilini gösterir (PvP stats ile)\n${CUSTOM_EMOJIS.coin} \`/coin [oyuncu]\` - Coin bilgilerini gösterir\n${CUSTOM_EMOJIS.xp} \`/level [oyuncu]\` - Level ve XP bilgilerini gösterir\n${CUSTOM_EMOJIS.stats} \`/stats [oyuncu]\` - Detaylı PvP istatistiklerini gösterir`, 
            inline: false 
          },
          { 
            name: `${CUSTOM_EMOJIS.trophy} **Liderlik Tabloları**`, 
            value: `${CUSTOM_EMOJIS.level} \`/top level\` - Level liderlik tablosu\n${CUSTOM_EMOJIS.coin} \`/top coin\` - Coin liderlik tablosu\n${CUSTOM_EMOJIS.xp} \`/top xp\` - XP liderlik tablosu\n${CUSTOM_EMOJIS.kill} \`/top kills\` - PvP kill liderlik tablosu\n${CUSTOM_EMOJIS.death} \`/top deaths\` - PvP death liderlik tablosu\n${CUSTOM_EMOJIS.kdr} \`/top kdr\` - K/D oranı liderlik tablosu`, 
            inline: false 
          },
          { 
            name: `${CUSTOM_EMOJIS.server} **Sunucu Komutları**`, 
            value: `${CUSTOM_EMOJIS.server} \`/sunucu\` - Hytale sunucu durumu ve online oyuncular\n${CUSTOM_EMOJIS.info} \`/yardım\` - Bu yardım menüsü`, 
            inline: false 
          },
          { 
            name: `${CUSTOM_EMOJIS.fire} **PvP Sistemi**`, 
            value: `${CUSTOM_EMOJIS.kill} **Sadece PvP kill'leri XP verir** (10 XP per kill)\n${CUSTOM_EMOJIS.xp} **100 XP = 1 Level** sistemi aktif\n${CUSTOM_EMOJIS.death} **Death penalty:** Mevcut XP'nin %5'i kaybedilir\n${CUSTOM_EMOJIS.kdr} **K/D Oranı** otomatik hesaplanır`, 
            inline: false 
          },
          { 
            name: `${CUSTOM_EMOJIS.warning} **Discord Hesap Bağlama**`, 
            value: `1️⃣ Hytale sunucusuna katıl\n2️⃣ \`/discord\` komutunu kullan\n3️⃣ OAuth linkine tıkla\n4️⃣ Aldığın kodu \`/kodgir <kod>\` ile gir\n5️⃣ Discord komutlarını kullanabilirsin!`, 
            inline: false 
          }
        )
        .addFields(
          { 
            name: `${CUSTOM_EMOJIS.success} **Kullanım İpuçları**`, 
            value: `• Komutlarda \`[oyuncu]\` parametresi opsiyoneldir\n• Boş bırakırsan kendi bilgilerin gösterilir\n• Liderlik tablolarında top 10 oyuncu gösterilir\n• PvP istatistikleri gerçek zamanlı güncellenir`, 
            inline: false 
          },
          { 
            name: `${CUSTOM_EMOJIS.fire} **Sosyal Medya**`, 
            value: `🎥 **YouTube:** https://www.youtube.com/@HytaleAkademi/featured\n💬 **Discord:** https://discord.gg/zWpDEpnNEh\n🎵 **TikTok:** https://www.tiktok.com/@hytale_akademi\n📸 **Instagram:** https://www.instagram.com/hytaleakademi\n🌐 **Web Panel:** https://hyturkiye.net`, 
            inline: false 
          }
        )
        .setTimestamp()
        .setFooter({ text: `${SERVER_NAME} • Bot Yardım Menüsü`, iconURL: SERVER_LOGO });

      await interaction.reply({
        embeds: [helpEmbed],
        ephemeral: true
      });
      
    } catch (err) {
      console.error("Yardım komutu hatası:", err.message);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`${CUSTOM_EMOJIS.error} Yardım Menüsü Hatası`)
        .setDescription('Yardım menüsü yüklenirken bir hata oluştu.')
        .setTimestamp()
        .setFooter({ text: SERVER_NAME, iconURL: SERVER_LOGO });

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }
});

// 🚀 BOT'U BAŞLAT
client.login(process.env.DISCORD_TOKEN);