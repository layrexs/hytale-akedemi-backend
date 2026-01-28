const axios = require('axios');

const BACKEND_URL = 'https://hyturkiye.net';

async function clearTestData() {
  console.log('🧹 Test Verilerini Temizleniyor...');
  console.log('==========================================');
  
  try {
    // Backend'e test verilerini temizleme isteği gönder
    const response = await axios.post(`${BACKEND_URL}/api/clear-test-data`, {
      confirm: true
    });
    
    console.log('✅ Test verileri temizlendi!');
    console.log('✅ Artık sadece gerçek Hytale oyuncuları gösterilecek');
    console.log('✅ Online oyuncular gerçek sunucu durumunu yansıtacak');
    console.log('\n📊 Şimdi test et:');
    console.log('• Hytale sunucusuna gir');
    console.log('• Website\'de online oyuncular bölümünü kontrol et');
    console.log('• Discord\'da /sunucu komutunu kullan');
    console.log('\n💡 Not: Sadece gerçekten sunucuda olan oyuncular gösterilecek');
    
  } catch (error) {
    console.error('❌ Test verilerini temizlerken hata:', error.message);
  }
}

clearTestData().catch(console.error);