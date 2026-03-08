// PATH: DriverAll-main/drivercv-backend/models/DynamicField.js
// ----------------------------------------------------------
// Dinamik Profil Alanları Modeli
// - Admin'in alanları yönetmesi
// - Role göre özel alanlar
// - Zorunluluk ve validasyon
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

// Validation şeması
const validationSchema = new Schema({
  required: { type: Boolean, default: false },
  minLength: { type: Number },
  maxLength: { type: Number },
  min: { type: Number },
  max: { type: Number },
  pattern: { type: String }, // regex pattern
  options: [{ type: String }], // select/multiselect için
  fileTypes: [{ type: String }], // file upload için
  fileSize: { type: Number }, // max file size (bytes)
  customValidation: { type: String } // custom validation function
}, { _id: false });

// Ana dinamik alan şeması
const dynamicFieldSchema = new Schema({
  // Alan bilgileri
  key: { type: String, required: true, trim: true, unique: true },
  label: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  placeholder: { type: String, trim: true },
  
  // Alan tipi
  type: { 
    type: String, 
    enum: [
      "text", "number", "email", "phone", "url", "password",
      "textarea", "rich", "date", "datetime", "time",
      "select", "multiselect", "radio", "checkbox",
      "file", "image", "document",
      "location", "coordinates", "range", "rating",
      "switch", "hidden", "computed"
    ], 
    required: true 
  },
  
  // Kategori ve bölüm
  category: {
    type: String,
    enum: ["personal", "contact", "business", "professional", "admin", "system"],
    required: true
  },
  section: { type: String, required: true, trim: true },
  subsection: { type: String, trim: true },
  
  // Rollere göre görünürlük
  roleVisibility: [{
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    isVisible: { type: Boolean, default: true },
    isRequired: { type: Boolean, default: false },
    isEditable: { type: Boolean, default: true },
    validation: validationSchema
  }],
  
  // Global validasyon (tüm roller için)
  globalValidation: validationSchema,
  
  // Sıralama ve görünüm
  order: { type: Number, default: 0 },
  groupOrder: { type: Number, default: 0 },
  
  // Görünüm ayarları
  appearance: {
    width: { type: String, enum: ["full", "half", "third", "quarter"], default: "full" },
    height: { type: String, enum: ["small", "medium", "large"], default: "medium" },
    icon: { type: String },
    color: { type: String, default: "#6366f1" },
    backgroundColor: { type: String },
    borderColor: { type: String },
    helpText: { type: String },
    warningText: { type: String }
  },
  
  // Bağımlılıklar
  dependencies: [{
    field: { type: String, required: true }, // hangi alana bağlı
    condition: { type: String, required: true }, // equals, not_equals, contains, etc.
    value: { type: Schema.Types.Mixed, required: true }, // koşul değeri
    action: { type: String, enum: ["show", "hide", "enable", "disable", "require"] }
  }],
  
  // Varsayılan değerler
  defaultValue: { type: Schema.Types.Mixed },
  computedValue: { type: String }, // computed field için
  
  // Durum
  isActive: { type: Boolean, default: true },
  isSystem: { type: Boolean, default: false }, // sistem alanı (silinemez)
  isPublic: { type: Boolean, default: false }, // herkese açık

  status: { type: String, enum: ["draft", "published"], default: "published" },
  version: { type: Number, default: 1 },
  publishedAt: { type: Date },
  publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
  
  // Meta veriler
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    source: { type: String, default: "admin" },
    tags: [{ type: String }],
    notes: { type: String, trim: true }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
dynamicFieldSchema.virtual('roleData', {
  ref: 'Role',
  localField: 'roleVisibility.role',
  foreignField: '_id'
});

// Indexes
dynamicFieldSchema.index({ key: 1 });
dynamicFieldSchema.index({ category: 1 });
dynamicFieldSchema.index({ section: 1 });
dynamicFieldSchema.index({ isActive: 1 });
dynamicFieldSchema.index({ "roleVisibility.role": 1 });
dynamicFieldSchema.index({ order: 1 });

// Methods
dynamicFieldSchema.methods.getVisibilityForRole = function(roleId) {
  const roleVisibility = this.roleVisibility.find(rv => rv.role.toString() === roleId.toString());
  return roleVisibility || {
    isVisible: true,
    isRequired: this.globalValidation?.required || false,
    isEditable: true,
    validation: this.globalValidation || {}
  };
};

dynamicFieldSchema.methods.validateValue = function(value, roleId) {
  const visibility = this.getVisibilityForRole(roleId);
  const validation = visibility.validation || {};
  
  const errors = [];
  
  // Required validation
  if (visibility.isRequired && (!value || value === "")) {
    errors.push("Bu alan zorunludur");
    return { isValid: false, errors };
  }
  
  if (!value || value === "") {
    return { isValid: true, errors: [] };
  }
  
  // Type validation
  switch (this.type) {
    case "email":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) errors.push("Geçerli bir e-posta adresi giriniz");
      break;
      
    case "phone":
      const phoneRegex = /^(\+90|0)?[0-9]{10}$/;
      if (!phoneRegex.test(value.replace(/[^0-9+]/g, ""))) {
        errors.push("Geçerli bir telefon numarası giriniz");
      }
      break;
      
    case "number":
      if (isNaN(value)) errors.push("Geçerli bir sayı giriniz");
      if (validation.min !== undefined && parseFloat(value) < validation.min) {
        errors.push(`Değer en az ${validation.min} olmalıdır`);
      }
      if (validation.max !== undefined && parseFloat(value) > validation.max) {
        errors.push(`Değer en fazla ${validation.max} olmalıdır`);
      }
      break;
      
    case "text":
    case "textarea":
      if (validation.minLength && value.length < validation.minLength) {
        errors.push(`En az ${validation.minLength} karakter giriniz`);
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        errors.push(`En fazla ${validation.maxLength} karakter giriniz`);
      }
      if (validation.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) errors.push("Format uygun değil");
      }
      break;
      
    case "select":
      if (validation.options && !validation.options.includes(value)) {
        errors.push("Geçerli bir seçenek yapınız");
      }
      break;
      
    case "multiselect":
      if (Array.isArray(value)) {
        if (validation.options && !value.every(v => validation.options.includes(v))) {
          errors.push("Geçerli seçenekler yapınız");
        }
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

dynamicFieldSchema.methods.getComputedValue = function(context) {
  if (!this.computedValue) return null;
  
  // Basit computed value sistemi
  try {
    // context: { user, profile, otherFields }
    const computed = this.computedValue
      .replace(/\{user\.(\w+)\}/g, (match, prop) => context.user?.[prop] || '')
      .replace(/\{profile\.(\w+)\}/g, (match, prop) => context.profile?.[prop] || '')
      .replace(/\{field\.(\w+)\}/g, (match, prop) => context.otherFields?.[prop] || '');
    
    return computed;
  } catch (error) {
    return null;
  }
};

// Static methods
dynamicFieldSchema.statics.findByRole = function(roleId, category = null) {
  const query = {
    isActive: true,
    "roleVisibility.role": roleId,
    "roleVisibility.isVisible": true
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .populate('roleVisibility.role')
    .sort({ category: 1, section: 1, order: 1 });
};

dynamicFieldSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true })
    .populate('roleVisibility.role')
    .sort({ section: 1, order: 1 });
};

dynamicFieldSchema.statics.getRequiredFields = function(roleId) {
  return this.find({
    isActive: true,
    "roleVisibility.role": roleId,
    "roleVisibility.isVisible": true,
    "roleVisibility.isRequired": true
  })
  .populate('roleVisibility.role')
  .sort({ category: 1, section: 1, order: 1 });
};

dynamicFieldSchema.statics.getPublicFields = function() {
  return this.find({ isActive: true, isPublic: true })
    .sort({ category: 1, section: 1, order: 1 });
};

// Pre-save middleware
dynamicFieldSchema.pre('save', function(next) {
  // Order'ı otomatik ayarla
  if (this.isNew && !this.order) {
    this.constructor.countDocuments({ category: this.category, section: this.section })
      .then(count => {
        this.order = count + 1;
        next();
      })
      .catch(next);
  } else {
    next();
  }
});

module.exports = mongoose.models.DynamicField || mongoose.model("DynamicField", dynamicFieldSchema);
