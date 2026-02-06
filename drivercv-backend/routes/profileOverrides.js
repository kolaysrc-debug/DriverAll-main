// PATH: DriverAll-main/drivercv-backend/routes/profileOverrides.js
// ----------------------------------------------------------
// Profil Override'ları API
// - GMN entegrasyonlu profil override'ları yönetimi
// - GET: Tüm override'ları listele
// - POST: Yeni override oluştur
// - PUT: Override güncelle
// ----------------------------------------------------------

const express = require('express');
const router = express.Router();

// Mock data
const mockOverrides = [
  {
    _id: '1',
    name: 'Admin Özel Alanları',
    description: 'Admin rolündeki kullanıcılara özel profil alanları göster',
    conditions: {
      role: 'admin'
    },
    actions: {
      show: true,
      require: false,
      defaultValue: null
    },
    priority: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'GMN Logic Test',
    description: 'GMN mantıksal motoru test override',
    conditions: {
      customLogic: 'if (user.experience > 5) { showAdvancedFields(); }'
    },
    actions: {
      show: true,
      require: true,
      validation: 'gmn_logic_check'
    },
    priority: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '3',
    name: 'Reklamveren Limit',
    description: 'Reklamverenler için bütçe limiti',
    conditions: {
      role: 'advertiser',
      field: 'budget_limit'
    },
    actions: {
      show: true,
      require: true,
      defaultValue: 5000
    },
    priority: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET: Tüm profil override'larını listele
router.get('/', async (req, res) => {
  try {
    console.log('Profile overrides requested');
    
    const overrides = mockOverrides;
    
    res.json({
      success: true,
      overrides: overrides,
      total: overrides.length,
      active: overrides.filter(o => o.isActive).length,
      roleBased: overrides.filter(o => o.conditions.role).length,
      withCustomLogic: overrides.filter(o => o.conditions.customLogic).length
    });
  } catch (error) {
    console.error('Profile overrides error:', error);
    res.status(500).json({
      success: false,
      message: 'Override\'lar yüklenemedi',
      error: error.message
    });
  }
});

// POST: Yeni profil override'ı oluştur
router.post('/', async (req, res) => {
  try {
    const { name, description, conditions, actions, priority } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Override adı zorunludur'
      });
    }

    const newOverride = {
      _id: Date.now().toString(),
      name: name.trim(),
      description: description || '',
      conditions: conditions || {},
      actions: actions || {},
      priority: priority || mockOverrides.length + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('New profile override created:', newOverride);
    
    res.status(201).json({
      success: true,
      override: newOverride,
      message: 'Profil override\'ı başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create profile override error:', error);
    res.status(500).json({
      success: false,
      message: 'Override oluşturulamadı',
      error: error.message
    });
  }
});

module.exports = router;
