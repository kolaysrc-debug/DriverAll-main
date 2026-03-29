const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile } = require('../lib/googleDrive');

// Dosyaları geçici olarak 'uploads/runtime' klasörüne kaydetmek için multer'ı yapılandır
const upload = multer({ dest: 'uploads/runtime/' });

/**
 * @route   POST /api/demo/upload-to-drive
 * @desc    Bir dosyayı Google Drive'a yükler (test amaçlı)
 * @access  Public
 */
router.post('/upload-to-drive', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Yüklenecek dosya bulunamadı.' });
    }

    // Google Drive'daki hedef klasör ID'si (bunu kendi klasör ID'nizle değiştirin)
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      console.error('[DemoRoute] Hata: GOOGLE_DRIVE_FOLDER_ID ortam değişkeni ayarlanmamış.');
      return res.status(500).json({ success: false, message: 'Sunucu yapılandırma hatası: Hedef klasör ID\'si eksik.' });
    }

    console.log(`[DemoRoute] Dosya alınıyor: ${req.file.originalname}, Boyut: ${req.file.size}`);
    console.log(`[DemoRoute] Google Drive'a yükleniyor... Klasör ID: ${folderId}`);

    const fileId = await uploadFile(req.file, folderId);

    if (fileId) {
      console.log(`[DemoRoute] Yükleme başarılı. Dosya ID: ${fileId}`);
      res.json({ 
        success: true, 
        message: 'Dosya başarıyla Google Drive\'a yüklendi.', 
        fileId: fileId,
        driveUrl: `https://drive.google.com/file/d/${fileId}/view`
      });
    } else {
      throw new Error('Google Drive yüklemesi başarısız oldu.');
    }

  } catch (error) {
    console.error('[DemoRoute] Yükleme sırasında bir hata oluştu:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Dosya yüklenirken sunucuda bir hata oluştu.' });
  }
});

module.exports = router;
