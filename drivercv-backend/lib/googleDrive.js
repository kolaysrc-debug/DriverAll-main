const { google } = require('googleapis');
const fs = require('fs');

/**
 * OAuth2 refresh token kullanarak bir auth istemcisi oluşturur.
 * .env dosyasındaki GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ve
 * GOOGLE_DRIVE_REFRESH_TOKEN değerlerini kullanır.
 * @returns {object} Bir OAuth2 istemcisi.
 */
function getAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    const missing = [];
    if (!clientId) missing.push('GOOGLE_CLIENT_ID');
    if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
    if (!refreshToken) missing.push('GOOGLE_DRIVE_REFRESH_TOKEN');
    throw new Error(`Google Drive yapılandırma eksik: ${missing.join(', ')}`);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

/**
 * Bir dosyayı Google Drive'daki belirli bir klasöre yükler.
 * @param {object} fileObject Multer'dan gelen dosya nesnesi.
 * @param {string} folderId Google Drive'daki klasörün ID'si.
 * @returns {Promise<string|null>} Yüklenen dosyanın ID'si veya hata durumunda null.
 */
async function uploadFile(fileObject, folderId) {
  try {
    const auth = getAuthClient();
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: fileObject.originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: fileObject.mimetype,
      body: fs.createReadStream(fileObject.path),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    return response.data.id;

  } catch (error) {
    console.error('[GoogleDrive] Dosya yükleme hatası:', error.message);
    return null;
  } finally {
    // Sunucudaki geçici dosyayı temizle
    if (fileObject && fileObject.path) {
      fs.unlink(fileObject.path, (err) => {
        if (err) console.error(`[GoogleDrive] Geçici dosya silinemedi: ${fileObject.path}`, err);
      });
    }
  }
}

module.exports = {
  uploadFile,
};
