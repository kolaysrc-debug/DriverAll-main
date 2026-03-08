// PATH: DriverAll-main/drivercv-backend/models/Industry.js
// ----------------------------------------------------------
// Sektör Modeli
// - İşletme sektörleri
// - Sektöre özel alanlar
// - Merkez/şube yapısı
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

// Sektör şeması
const industrySchema = new Schema({
  // Sektör bilgileri
  name: { type: String, required: true, trim: true, unique: true },
  displayName: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  code: { type: String, required: true, trim: true, unique: true },
  
  // Kategori
  category: {
    type: String,
    enum: ["transport", "manufacturing", "storage", "education", "service", "technology", "other"],
    required: true
  },
  
  // Görsel
  icon: { type: String, trim: true },
  color: { type: String, default: "#6366f1" },
  image: { type: String }, // logo URL
  
  // Sektöre özel alanlar
  customFields: [{
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { 
      type: String, 
      enum: ["text", "number", "email", "phone", "select", "multiselect", "textarea", "date"],
      required: true 
    },
    required: { type: Boolean, default: false },
    validation: {
      minLength: { type: Number },
      maxLength: { type: Number },
      min: { type: Number },
      max: { type: Number },
      pattern: { type: String },
      options: [{ type: String }]
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }],
  
  // Şube yapısı
  branchStructure: {
    allowsMultipleBranches: { type: Boolean, default: true },
    requiresMainBranch: { type: Boolean, default: true },
    branchTypes: [{
      type: { type: String, required: true }, // headquarter, branch, depot, office, etc.
      name: { type: String, required: true, trim: true },
      description: { type: String, trim: true },
      isRequired: { type: Boolean, default: false },
      maxCount: { type: Number },
      customFields: [{
        key: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
        type: { type: String, required: true },
        required: { type: Boolean, default: false }
      }]
    }]
  },
  
  // Yetki ve lisans gereksinimleri
  requirements: {
    licenses: [{
      name: { type: String, required: true, trim: true },
      description: { type: String, trim: true },
      isRequired: { type: Boolean, default: false },
      expiryRequired: { type: Boolean, default: false }
    }],
    certifications: [{
      name: { type: String, required: true, trim: true },
      description: { type: String, trim: true },
      isRequired: { type: Boolean, default: false },
      expiryRequired: { type: Boolean, default: false }
    }],
    permits: [{
      name: { type: String, required: true, trim: true },
      description: { type: String, trim: true },
      isRequired: { type: Boolean, default: false },
      expiryRequired: { type: Boolean, default: false }
    }]
  },
  
  // Servisler
  services: [{
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }],
  
  // Durum
  isActive: { type: Boolean, default: true },
  isSystem: { type: Boolean, default: false }, // sistem sektörü (silinemez)
  
  // İstatistikler
  stats: {
    companyCount: { type: Number, default: 0 },
    branchCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  
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
industrySchema.virtual('companies', {
  ref: 'DynamicProfile',
  localField: '_id',
  foreignField: 'businessInfo.industry',
  count: true
});

// Indexes
industrySchema.index({ name: 1 });
industrySchema.index({ code: 1 });
industrySchema.index({ category: 1 });
industrySchema.index({ isActive: 1 });

// Methods
industrySchema.methods.getCustomFields = function() {
  return this.customFields.filter(field => field.isActive);
};

industrySchema.methods.getBranchTypes = function() {
  return this.branchStructure.branchTypes;
};

industrySchema.methods.getRequiredLicenses = function() {
  return this.requirements.licenses.filter(license => license.isRequired);
};

industrySchema.methods.getRequiredCertifications = function() {
  return this.requirements.certifications.filter(cert => cert.isRequired);
};

industrySchema.methods.getRequiredPermits = function() {
  return this.requirements.permits.filter(permit => permit.isRequired);
};

industrySchema.methods.getServices = function() {
  return this.services.filter(service => service.isActive);
};

industrySchema.methods.updateStats = async function() {
  const DynamicProfile = mongoose.model('DynamicProfile');
  const Branch = mongoose.model('Branch');
  
  const companyCount = await DynamicProfile.countDocuments({
    "businessInfo.industry": this._id,
    "status.isProfileComplete": true
  });
  
  const branchCount = await Branch.countDocuments({
    parentUser: { $in: await DynamicProfile.find({
      "businessInfo.industry": this._id
    }).distinct('user') },
    "status.isActive": true,
    "status.isApproved": true
  });
  
  this.stats.companyCount = companyCount;
  this.stats.branchCount = branchCount;
  this.stats.lastUpdated = new Date();
  
  return this.save();
};

// Static methods
industrySchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true })
    .sort({ name: 1 });
};

industrySchema.statics.getActiveIndustries = function() {
  return this.find({ isActive: true })
    .sort({ category: 1, name: 1 });
};

industrySchema.statics.getIndustryByCode = function(code) {
  return this.findOne({ code, isActive: true });
};

industrySchema.statics.searchIndustries = function(query) {
  return this.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: "i" } },
      { displayName: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { "metadata.tags": { $regex: query, $options: "i" } }
    ]
  }).sort({ name: 1 });
};

// Pre-save middleware
industrySchema.pre('save', function(next) {
  // Code'u otomatik oluştur
  if (!this.code && this.name) {
    this.code = this.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 4);
  }
  
  next();
});

module.exports = mongoose.models.Industry || mongoose.model("Industry", industrySchema);
