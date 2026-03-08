// PATH: DriverAll-main/drivercv-backend/models/DynamicProfile.js
// ----------------------------------------------------------
// Dinamik Profil Modeli
// - Role-based profil alanları
// - Dinamik kriterler
// - Lokasyon bazlı veriler
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

// Dinamik alan değeri şeması
const dynamicFieldValueSchema = new Schema({
  key: { type: String, required: true, trim: true },
  value: { type: Schema.Types.Mixed }, // text, number, array, object
  type: { type: String, required: true }, // alan tipi
  isValidated: { type: Boolean, default: false },
  validationErrors: [{ type: String }],
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

// Lokasyon verisi şeması
const locationDataSchema = new Schema({
  countryCode: { type: String, required: true, default: "TR" },
  stateCode: { type: String, trim: true }, // TR-34
  stateName: { type: String, trim: true },
  districtCode: { type: String, trim: true }, // TR-34-001
  districtName: { type: String, trim: true },
  fullAddress: { type: String, trim: true },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  isRestricted: { type: Boolean, default: false },
  restrictionReason: { type: String }
}, { _id: false });

// Yetki alanı şeması
const permissionFieldSchema = new Schema({
  module: { type: String, required: true },
  permissions: [{ type: String }], // create, read, update, delete
  restrictions: {
    locations: [{ type: String }], // izinli lokasyon kodları
    roles: [{ type: String }], // izinli roller
    custom: { type: Schema.Types.Mixed }
  }
}, { _id: false });

// Ana profil şeması
const dynamicProfileSchema = new Schema({
  // Kullanıcı bağlantısı
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true
  },
  
  // Rol bilgisi
  role: {
    type: Schema.Types.ObjectId,
    ref: "Role",
    required: true,
    index: true
  },
  
  // Temel bilgiler (her rol için ortak)
  basicInfo: {
    fullName: { type: String, trim: true },
    displayName: { type: String, trim: true },
    avatar: { type: String }, // URL
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    about: { type: String, trim: true }
  },
  
  // Lokasyon bilgisi
  location: locationDataSchema,
  
  // Dinamik alanlar (role-based)
  dynamicFields: [dynamicFieldValueSchema],
  
  // Kriter değerleri
  criteriaValues: {
    experience: {
      years: { type: Number, default: 0 },
      months: { type: Number, default: 0 },
      field: { type: String, trim: true }
    },
    skills: [{
      name: { type: String, required: true },
      level: { 
        type: String, 
        enum: ["beginner", "intermediate", "advanced", "expert"],
        default: "beginner"
      },
      certificate: { type: String }, // sertifika URL
      expiryDate: { type: Date }
    }],
    documents: [{
      type: { type: String, required: true }, // ehliyet, src, psikoteknik, etc.
      number: { type: String, trim: true },
      issueDate: { type: Date },
      expiryDate: { type: Date },
      validityYears: { type: Number, default: null },
      issuingAuthority: { type: String, trim: true },
      fileUrl: { type: String },
      isVerified: { type: Boolean, default: false },
      verificationDate: { type: Date }
    }],
    custom: { type: Schema.Types.Mixed, default: {} } // rol özel kriterler
  },
  
  // İşletme bilgileri (business rolleri için)
  businessInfo: {
    companyName: { type: String, trim: true },
    taxNumber: { type: String, trim: true },
    taxOffice: { type: String, trim: true },
    establishmentDate: { type: Date },
    employeeCount: { type: Number, default: 0 },
    fleetSize: { type: Number, default: 0 },
    businessType: { type: String, trim: true },
    website: { type: String, trim: true },
    socialMedia: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      twitter: { type: String, trim: true }
    }
  },
  
  // Şube bilgileri (işletmeler için)
  branches: [{
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    location: locationDataSchema,
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      manager: { type: String, trim: true }
    },
    isActive: { type: Boolean, default: true },
    isMain: { type: Boolean, default: false }
  }],
  
  // Yetki alanları
  permissions: [permissionFieldSchema],
  
  // Durum ve doğrulama
  status: {
    isProfileComplete: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationDate: { type: Date },
    verificationLevel: { 
      type: String, 
      enum: ["none", "basic", "standard", "premium"],
      default: "none" 
    },
    lastValidationDate: { type: Date },
    validationErrors: [{ type: String }]
  },
  
  // Aktivite ve istatistikler
  stats: {
    profileViews: { type: Number, default: 0 },
    lastLogin: { type: Date },
    lastProfileUpdate: { type: Date, default: Date.now },
    completedFields: { type: Number, default: 0 },
    totalFields: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0 }
  },
  
  // Ayarlar
  settings: {
    isPublic: { type: Boolean, default: false },
    allowContact: { type: Boolean, default: true },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    privacy: {
      showPhone: { type: Boolean, default: false },
      showEmail: { type: Boolean, default: false },
      showLocation: { type: Boolean, default: true }
    }
  },
  
  // Meta veriler
  metadata: {
    source: { type: String, default: "web" }, // web, mobile, api, admin
    ipAddress: { type: String },
    userAgent: { type: String },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
dynamicProfileSchema.virtual('completionPercentage').get(function() {
  if (this.stats.totalFields === 0) return 0;
  return Math.round((this.stats.completedFields / this.stats.totalFields) * 100);
});

dynamicProfileSchema.virtual('roleData', {
  ref: 'Role',
  localField: 'role',
  foreignField: '_id',
  justOne: true
});

dynamicProfileSchema.virtual('userData', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Indexes
dynamicProfileSchema.index({ user: 1 });
dynamicProfileSchema.index({ role: 1 });
dynamicProfileSchema.index({ "location.stateCode": 1 });
dynamicProfileSchema.index({ "location.districtCode": 1 });
dynamicProfileSchema.index({ "status.isProfileComplete": 1 });
dynamicProfileSchema.index({ "status.isVerified": 1 });
dynamicProfileSchema.index({ "businessInfo.companyName": 1 });

// Methods
dynamicProfileSchema.methods.getFieldValue = function(key) {
  const field = this.dynamicFields.find(f => f.key === key);
  return field ? field.value : null;
};

dynamicProfileSchema.methods.setFieldValue = function(key, value, type) {
  const existingIndex = this.dynamicFields.findIndex(f => f.key === key);
  
  const fieldData = {
    key,
    value,
    type,
    isValidated: false,
    validationErrors: [],
    lastUpdated: new Date()
  };
  
  if (existingIndex >= 0) {
    this.dynamicFields[existingIndex] = fieldData;
  } else {
    this.dynamicFields.push(fieldData);
  }
  
  return this;
};

dynamicProfileSchema.methods.validateField = function(key, validationRules) {
  const field = this.dynamicFields.find(f => f.key === key);
  if (!field) return false;
  
  const errors = [];
  
  // Required validation
  if (validationRules.required && (!field.value || field.value === "")) {
    errors.push("Bu alan zorunludur");
  }
  
  // Type validation
  if (field.value && validationRules.type) {
    switch (validationRules.type) {
      case "number":
        if (isNaN(field.value)) errors.push("Geçerli bir sayı giriniz");
        if (validationRules.min && field.value < validationRules.min) {
          errors.push(`Değer en az ${validationRules.min} olmalıdır`);
        }
        if (validationRules.max && field.value > validationRules.max) {
          errors.push(`Değer en fazla ${validationRules.max} olmalıdır`);
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) errors.push("Geçerli bir e-posta adresi giriniz");
        break;
      case "text":
        if (validationRules.minLength && field.value.length < validationRules.minLength) {
          errors.push(`En az ${validationRules.minLength} karakter giriniz`);
        }
        if (validationRules.maxLength && field.value.length > validationRules.maxLength) {
          errors.push(`En fazla ${validationRules.maxLength} karakter giriniz`);
        }
        break;
    }
  }
  
  field.validationErrors = errors;
  field.isValidated = errors.length === 0;
  
  return field.isValidated;
};

dynamicProfileSchema.methods.validateAllFields = function(roleData) {
  if (!roleData) return false;
  
  let allValid = true;
  this.stats.completedFields = 0;
  this.stats.totalFields = 0;
  
  // Role-specific alanları validate et
  roleData.profileFields.forEach(field => {
    this.stats.totalFields++;
    if (this.validateField(field.key, field)) {
      this.stats.completedFields++;
    } else {
      allValid = false;
    }
  });
  
  // Lokasyon kontrolü
  if (roleData.locationRestrictions.type !== "none") {
    if (!this.location.stateCode) {
      allValid = false;
    }
  }
  
  this.status.isProfileComplete = allValid;
  this.stats.lastValidationDate = new Date();
  
  return allValid;
};

dynamicProfileSchema.methods.hasPermission = function(module, action, locationCode = null) {
  const modulePerms = this.permissions.find(p => p.module === module);
  if (!modulePerms) return false;
  
  if (!modulePerms.permissions.includes(action)) return false;
  
  // Lokasyon kontrolü
  if (locationCode && modulePerms.restrictions.locations.length > 0) {
    if (!modulePerms.restrictions.locations.includes(locationCode)) {
      return false;
    }
  }
  
  return true;
};

// Static methods
dynamicProfileSchema.statics.findByRole = function(roleId) {
  return this.find({ role: roleId }).populate('role');
};

dynamicProfileSchema.statics.findByLocation = function(stateCode, districtCode = null) {
  const query = { "location.stateCode": stateCode };
  if (districtCode) {
    query["location.districtCode"] = districtCode;
  }
  return this.find(query).populate('role');
};

dynamicProfileSchema.statics.findIncompleteProfiles = function() {
  return this.find({ "status.isProfileComplete": false }).populate('role');
};

// Pre-save middleware
dynamicProfileSchema.pre('save', function(next) {
  // Completion percentage'i hesapla
  this.stats.completionPercentage = this.completionPercentage;
  this.stats.lastProfileUpdate = new Date();
  
  next();
});

module.exports = mongoose.models.DynamicProfile || mongoose.model("DynamicProfile", dynamicProfileSchema);
