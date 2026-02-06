// PATH: DriverAll-main/drivercv-backend/routes/profileSections.js
// ----------------------------------------------------------
// Profil Bölümleri API
// - GMN entegrasyonlu profil bölümleri yönetimi
// - GET: Tüm bölümleri listele
// - POST: Yeni bölüm oluştur
// - PUT: Bölüm güncelle
// ----------------------------------------------------------

const express = require('express');
const router = express.Router();

// Mock data
const mockSections = [
  {
    _id: '1',
    name: 'Kişisel Bilgiler',
    description: 'Kullanıcının temel kişisel bilgileri',
    order: 1,
    isActive: true,
    fields: ['ad', 'soyad', 'tc_kimlik', 'dogum_tarihi'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'İletişim Bilgileri',
    description: 'Telefon, e-posta ve adres bilgileri',
    order: 2,
    isActive: true,
    fields: ['telefon', 'email', 'adres', 'il', 'ilce'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '3',
    name: 'Profesyonel Bilgiler',
    description: 'GMN optimize edilmiş profesyonel bölüm',
    order: 3,
    isActive: true,
    fields: ['meslek', 'deneyim_yili', 'uzmanlik_alani', 'sertifikalar'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET: Tüm profil bölümlerini listele
router.get('/', async (req, res) => {
  try {
    console.log('Profile sections requested');
    
    const sections = mockSections;
    
    res.json({
      success: true,
      sections: sections,
      total: sections.length,
      active: sections.filter(s => s.isActive).length,
      averageFields: sections.length > 0 ? Math.round(sections.reduce((acc, s) => acc + (s.fields?.length || 0), 0) / sections.length) : 0
    });
  } catch (error) {
    console.error('Profile sections error:', error);
    res.status(500).json({
      success: false,
      message: 'Bölümler yüklenemedi',
      error: error.message
    });
  }
});

// POST: Yeni profil bölümü oluştur
router.post('/', async (req, res) => {
  try {
    const { name, description, order } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Bölüm adı zorunludur'
      });
    }

    const newSection = {
      _id: Date.now().toString(),
      name: name.trim(),
      description: description || '',
      order: order || mockSections.length + 1,
      isActive: true,
      fields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('New profile section created:', newSection);
    
    res.status(201).json({
      success: true,
      section: newSection,
      message: 'Profil bölümü başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create profile section error:', error);
    res.status(500).json({
      success: false,
      message: 'Bölüm oluşturulamadı',
      error: error.message
    });
  }
});

module.exports = router;
