/**
 * Tek seferlik script: Google Drive API için refresh token alır.
 * 
 * Kullanım:
 *   1. node scripts/getDriveToken.js
 *   2. Çıkan URL'yi tarayıcıda açın, izin verin
 *   3. Yönlendirilen URL'deki "code=" değerini kopyalayıp terminale yapıştırın
 *   4. .env dosyasına eklenen GOOGLE_DRIVE_REFRESH_TOKEN ile işlem tamamdır
 */
require('dotenv').config();
const readline = require('readline');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// urn:ietf:wg:oauth:2.0:oob yerine redirect_uri olarak localhost kullanıyoruz
// ama kodu URL bar'dan manuel alacağız
const REDIRECT_URI = 'http://localhost:3001/api/auth/google/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Hata: .env dosyasında GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET tanımlı olmalı.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive.file'],
  prompt: 'select_account consent',
});

console.log('\n=========================================================');
console.log('  Google Drive Refresh Token Alma Araci');
console.log('=========================================================');
console.log('\n1. Asagidaki URL\'yi tarayicinizda acin (InPrivate/Gizli pencere oneririz):\n');
console.log(authUrl);
console.log('\n2. Google hesabinizla giris yapin ve izin verin.');
console.log('3. Sayfa "localhost" adresine yonlenecek ve HATA verecek - BU NORMAL!');
console.log('4. Tarayicinin ADRES CUBUGU\'ndaki URL\'yi TAMAMEN kopyalayin.');
console.log('   Ornek: http://localhost:3001/api/auth/google/callback?code=4/0A...&scope=...');
console.log('5. Kopyaladiginiz URL\'yi asagiya yapistirin:\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('URL veya code yapistirin: ', async (input) => {
  try {
    let code = input.trim();
    
    // URL yapıştırıldıysa code parametresini çıkar
    if (code.includes('code=')) {
      const url = new URL(code.replace(/\s/g, ''));
      code = url.searchParams.get('code');
    }
    
    if (!code) {
      console.error('Hata: Kod bulunamadi.');
      process.exit(1);
    }

    console.log('\nToken aliniyor...');
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      console.error('Hata: Refresh token alinamadi. Tekrar deneyin.');
      process.exit(1);
    }

    // .env dosyasına otomatik ekle
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('GOOGLE_DRIVE_REFRESH_TOKEN')) {
      envContent = envContent.replace(/GOOGLE_DRIVE_REFRESH_TOKEN=.*/, `GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}`);
    } else {
      envContent = envContent.trimEnd() + `\nGOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);

    console.log('\n=========================================================');
    console.log('  BASARILI! Refresh token alindi ve .env dosyasina eklendi.');
    console.log('=========================================================');
    console.log(`\nToken: ${refreshToken.substring(0, 20)}...`);
    console.log('\nSimdi backend\'i yeniden baslatin.\n');

  } catch (err) {
    console.error('\nHata:', err.message);
    if (err.message.includes('invalid_grant')) {
      console.error('Kod suresi dolmus olabilir. Tekrar deneyin.');
    }
  } finally {
    rl.close();
    process.exit(0);
  }
});
