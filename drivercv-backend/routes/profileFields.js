// PATH: DriverAll-main/drivercv-backend/routes/profileFields.js
// ----------------------------------------------------------
// Profil Alanları API
// - GMN entegrasyonlu profil alanları yönetimi
// - GET: Tüm alanları listele
// - POST: Yeni alan oluştur
// - PUT: Alan güncelle
// ----------------------------------------------------------

const express = require('express');
const router = express.Router();

// Mock data
const mockFields = [
  {
    _id: '1',
    name: 'ad',
    label: 'Ad',
    type: 'text',
    section: 'Kişisel Bilgiler',
    required: true,
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'email',
    label: 'E-posta',
    type: 'text',
    section: 'İletişim Bilgileri',
    required: true,
    isActive: true,
    validation: {
      pattern: '^[^\\s@]+@[^\\s]+\\.[^\\s]+$'
    },
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '3',
    name: 'deneyim_yili',
    label: 'Deneyim Yılı',
    type: 'number',
    section: 'Profesyonel Bilgiler',
    required: false,
    isActive: true,
    validation: {
      min: 0,
      max: 50
    },
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '4',
    name: 'ehliyet_turu',
    label: 'Ehliyet Türü',
    type: 'select',
    section: 'Profesyonel Bilgiler',
    required: true,
    isActive: true,
    options: ['B', 'C', 'D', 'E'],
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '5',
    name: 'yabanci_dil',
    label: 'Yabancı Dil',
    type: 'multiselect',
    section: 'Profesyonel Bilgiler',
    required: false,
    isActive: true,
    options: ['İngilizce', 'Almanca', 'Fransızca', 'İspanyolca'],
    order: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET: Tüm profil alanlarını listele
router.get('/', async (req, res) => {
  try {
    console.log('Profile fields requested');
    
    const fields = mockFields;
    
    res.json({
      success: true,
      fields: fields,
      total: fields.length,
      active: fields.filter(f => f.isActive).length,
      required: fields.filter(f => f.required).length,
      withValidation: fields.filter(f => f.validation).length
    });
  } catch (error) {
    console.error('Profile fields error:', error);
    res.status(500).json({
      success: false,
      message: 'Alanlar yüklenemedi',
      error: error.message
    });
  }
});

// POST: Yeni profil alanı oluştur
router.post('/', async (req, res) => {
  try {
    const { name, label, type, section, required, validation, options } = req.body;
    
    if (!name || !label || !type) {
      return res.status(400).json({
        success: false,
        message: 'Alan adı, label ve tipi zorunludur'
      });
    }

    const newField = {
      _id: Date.now().toString(),
      name: name.trim(),
      label: label.trim(),
      type,
      section: section || '',
      required: required || false,
      isActive: true,
      validation: validation || null,
      options: options || [],
      order: mockFields.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('New profile field created:', newField);
    
    res.status(201).json({
      success: true,
      field: newField,
      message: 'Profil alanı başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create profile field error:', error);
    res.status(500).json({
      success: false,
      message: 'Alan oluşturulamadı',
      error: error.message
    });
  }
});

module.exports = router;
