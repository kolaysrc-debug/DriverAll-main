// PATH: DriverAll-main/drivercv-backend/models/Role.js
// ----------------------------------------------------------
// Dinamik Rol Modeli - Hiyerarşik Sistem
// - Ana Rol → Alt Rol yapısı
// - Dinamik kriterler
// - Lokasyon bazlı yetkiler
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

// Kriter şeması
const criteriaSchema = new Schema({
  key: { type: String, required: true, trim: true },
  label: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    enum: ["number", "text", "select", "multiselect", "date", "boolean", "textarea"], 
    required: true 
  },
  required: { type: Boolean, default: false },
  validation: {
    min: { type: Number },
    max: { type: Number },
    pattern: { type: String },
    options: [{ type: String }] // select/multiselect için
  },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { _id: false });

// Lokasyon kısıtlaması şeması
const locationRestrictionSchema = new Schema({
  type: { 
    type: String, 
    enum: ["none", "country", "state", "district", "custom"], 
    default: "none" 
  },
  allowedCountries: [{ type: String, trim: true }],
  allowedStates: [{ type: String, trim: true }],
  allowedDistricts: [{ type: String, trim: true }],
  customAreas: [{
    name: { type: String, required: true },
    description: { type: String },
    locationCodes: [{ type: String }] // TR-34, TR-34-001 gibi
  }]
}, { _id: false });

// Yetki şeması
const permissionSchema = new Schema({
  module: { type: String, required: true }, // profile, jobs, ads, users, etc.
  actions: [{
    action: { type: String, required: true }, // create, read, update, delete
    allowed: { type: Boolean, default: false },
    conditions: {
      ownOnly: { type: Boolean, default: false },
      locationBased: { type: Boolean, default: false },
      roleBased: { type: Boolean, default: false }
    }
  }]
}, { _id: false });

// Ana rol şeması
const roleSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  displayName: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  
  // Hiyerarşi
  parentRole: { 
    type: Schema.Types.ObjectId, 
    ref: "Role",
    default: null 
  },
  level: { type: Number, default: 0 }, // 0 = ana rol, 1 = alt rol, 2 = alt-alt rol
  category: { 
    type: String, 
    enum: ["candidate", "employer", "advertiser", "service_provider", "admin"],
    required: true 
  },
  
  // Durum
  isActive: { type: Boolean, default: true },
  isSystem: { type: Boolean, default: false }, // sistem rolü (silinemez)
  
  // Kriterler
  criteria: [criteriaSchema],
  
  // Lokasyon kısıtlamaları
  locationRestrictions: locationRestrictionSchema,
  
  // Yetkiler
  permissions: [permissionSchema],
  
  // Profil alanları
  profileFields: [{
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { 
      type: String, 
      enum: ["text", "number", "email", "phone", "date", "select", "multiselect", "textarea", "file"], 
      required: true 
    },
    required: { type: Boolean, default: false },
    validation: {
      min: { type: Number },
      max: { type: Number },
      pattern: { type: String },
      options: [{ type: String }]
    },
    order: { type: Number, default: 0 },
    section: { type: String, default: "general" },
    isActive: { type: Boolean, default: true }
  }],
  
  // Meta
  icon: { type: String }, // emoji veya icon class
  color: { type: String, default: "#6366f1" }, // theme color
  sortOrder: { type: Number, default: 0 },
  
  // İstatistikler
  userCount: { type: Number, default: 0 },
  
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User" 
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User" 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
roleSchema.virtual('isParentRole').get(function() {
  return this.level === 0;
});

roleSchema.virtual('isChildRole').get(function() {
  return this.level > 0;
});

roleSchema.virtual('childRoles', {
  ref: 'Role',
  localField: '_id',
  foreignField: 'parentRole'
});

roleSchema.virtual('parentRoleData', {
  ref: 'Role',
  localField: 'parentRole',
  foreignField: '_id',
  justOne: true
});

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ parentRole: 1 });
roleSchema.index({ category: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ level: 1 });

// Methods
roleSchema.methods.getAllCriteria = function() {
  let allCriteria = [...this.criteria];
  
  // Parent kriterlerini de ekle
  if (this.parentRoleData) {
    allCriteria = [...this.parentRoleData.criteria, ...allCriteria];
  }
  
  return allCriteria;
};

roleSchema.methods.getAllPermissions = function() {
  let allPermissions = [...this.permissions];
  
  // Parent yetkilerini de ekle
  if (this.parentRoleData) {
    allPermissions = [...this.parentRoleData.permissions, ...allPermissions];
  }
  
  return allPermissions;
};

roleSchema.methods.can = function(module, action) {
  const permissions = this.getAllPermissions();
  const modulePerms = permissions.find(p => p.module === module);
  
  if (!modulePerms) return false;
  
  const actionPerm = modulePerms.actions.find(a => a.action === action);
  return actionPerm ? actionPerm.allowed : false;
};

// Static methods
roleSchema.statics.getRootRoles = function() {
  return this.find({ parentRole: null }).sort({ sortOrder: 1, name: 1 });
};

roleSchema.statics.getChildRoles = function(parentId) {
  return this.find({ parentRole: parentId }).sort({ sortOrder: 1, name: 1 });
};

roleSchema.statics.getRoleTree = function() {
  return this.getRootRoles().populate({
    path: 'childRoles',
    populate: {
      path: 'childRoles',
      populate: {
        path: 'childRoles'
      }
    }
  });
};

roleSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Pre-save middleware
roleSchema.pre('save', async function(next) {
  // Level'ı otomatik hesapla (sadece level set edilmemişse)
  if (this.level === undefined || this.level === null) {
    if (this.parentRole) {
      const parent = await this.constructor.findById(this.parentRole);
      this.level = parent ? parent.level + 1 : 1;
    } else {
      this.level = 0;
    }
  }
  
  next();
});

module.exports = mongoose.models.Role || mongoose.model("Role", roleSchema);
