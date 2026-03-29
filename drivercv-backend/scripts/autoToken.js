require('dotenv').config();
const http = require('http');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/api/auth/google/callback';
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3001');
  if (url.pathname === '/api/auth/google/callback' && url.searchParams.get('code')) {
    const code = url.searchParams.get('code');
    try {
      const { tokens } = await oauth2Client.getToken(code);
      const t = tokens.refresh_token;
      if (!t) { res.end('HATA: refresh token yok'); server.close(); process.exit(1); }
      const ep = path.join(__dirname, '..', '.env');
      let e = fs.readFileSync(ep, 'utf8');
      if (e.includes('GOOGLE_DRIVE_REFRESH_TOKEN')) {
        e = e.replace(/GOOGLE_DRIVE_REFRESH_TOKEN=.*/, 'GOOGLE_DRIVE_REFRESH_TOKEN=' + t);
      } else {
        e = e.trimEnd() + '\nGOOGLE_DRIVE_REFRESH_TOKEN=' + t + '\n';
      }
      fs.writeFileSync(ep, e);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1 style="color:green">BASARILI! Token alindi.</h1><p>Bu pencereyi kapatabilirsiniz.</p>');
      console.log('SUCCESS! Refresh token .env dosyasina kaydedildi.');
      console.log('Token: ' + t.substring(0, 25) + '...');
      server.close();
      process.exit(0);
    } catch (err) {
      res.end('HATA: ' + err.message);
      console.error('HATA:', err.message);
      server.close();
      process.exit(1);
    }
  } else {
    res.end('Bekleniyor...');
  }
});

server.listen(3001, () => {
  console.log('Sunucu 3001 portunda hazir. Tarayicida izin verin...');
});
