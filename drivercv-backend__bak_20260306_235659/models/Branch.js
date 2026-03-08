// PATH: DriverAll-main/drivercv-backend/models/Branch.js
// ----------------------------------------------------------
// Şube Modeli
// - İşletme şubeleri
// - Lokasyon ve yetki yönetimi
// - Onay sistemi
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

// Şube şeması
const branchSchema = new Schema({
  // Ana işletme bağlantısı
  parentUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  // Şube bilgileri
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, unique: true },
  displayName: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  
  // Lokasyon bilgileri
  location: {
    countryCode: { type: String, required: true, default: "TR" },
    stateCode: { type: String, required: true, trim: true }, // TR-34
    stateName: { type: String, required: true, trim: true },
    districtCode: { type: String, required: true, trim: true }, // TR-34-001
    districtName: { type: String, required: true, trim: true },
    fullAddress: { type: String, required: true, trim: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    postalCode: { type: String, trim: true }
  },
  
  // İletişim bilgileri
  contact: {
    phone: { type: String, required: true, trim: true },
    mobilePhone: { type: String, trim: true },
    fax: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    website: { type: String, trim: true }
  },
  
  // Şube yöneticisi
  manager: {
    name: { type: String, trim: true },
    title: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true }
  },
  
  // Çalışma saatleri
  workingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },
  
  // Servis bilgileri
  services: [{
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    priceRange: { type: String, trim: true }
  }],
  
  // Durum ve onay
  status: {
    isActive: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    approvalDate: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
    isMainBranch: { type: Boolean, default: false }
  },
  
  // İstatistikler
  stats: {
    employeeCount: { type: Number, default: 0 },
    subUserCount: { type: Number, default: 0 },
    jobPostCount: { type: Number, default: 0 },
    adPostCount: { type: Number, default: 0 },
    lastActivity: { type: Date }
  },
  
  // Meta veriler
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    source: { type: String, default: "business" }, // business, admin, api
    notes: { type: String, trim: true }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
branchSchema.virtual('parentUserData', {
  ref: 'User',
  localField: 'parentUser',
  foreignField: '_id',
  justOne: true
});

branchSchema.virtual('subUsers', {
  ref: 'SubUser',
  localField: '_id',
  foreignField: 'assignedBranches.branch'
});

// Indexes
branchSchema.index({ parentUser: 1 });
branchSchema.index({ code: 1 });
branchSchema.index({ "location.stateCode": 1 });
branchSchema.index({ "location.districtCode": 1 });
branchSchema.index({ "status.isActive": 1 });
branchSchema.index({ "status.isApproved": 1 });

// Methods
branchSchema.methods.approve = function(approvedBy, notes = "") {
  this.status.isApproved = true;
  this.status.approvalDate = new Date();
  this.status.approvedBy = approvedBy;
  this.status.isActive = true;
  this.metadata.notes = notes;
  
  return this;
};

branchSchema.methods.reject = function(rejectedBy, reason) {
  this.status.isApproved = false;
  this.status.rejectionReason = reason;
  
  return this;
};

branchSchema.methods.activate = function(activatedBy) {
  this.status.isActive = true;
  this.metadata.updatedBy = activatedBy;
  
  return this;
};

branchSchema.methods.deactivate = function(deactivatedBy, reason) {
  this.status.isActive = false;
  this.metadata.updatedBy = deactivatedBy;
  this.metadata.notes = reason;
  
  return this;
};

branchSchema.methods.setAsMainBranch = function() {
  // Önceki ana şubeyi kaldır
  return this.constructor.updateMany(
    { parentUser: this.parentUser, "status.isMainBranch": true },
    { "status.isMainBranch": false }
  ).then(() => {
    this.status.isMainBranch = true;
    return this.save();
  });
};

branchSchema.methods.updateStats = async function() {
  const SubUser = mongoose.model('SubUser');
  
  // Alt kullanıcı sayısını güncelle
  const subUserCount = await SubUser.countDocuments({
    "assignedBranches.branch": this._id,
    "status.isActive": true,
    "status.isApproved": true
  });
  
  this.stats.subUserCount = subUserCount;
  this.stats.lastActivity = new Date();
  
  return this.save();
};

// Static methods
branchSchema.statics.findByParentUser = function(parentUserId) {
  return this.find({ parentUser: parentUserId })
    .populate('parentUser')
    .sort({ name: 1 });
};

branchSchema.statics.findByLocation = function(stateCode, districtCode = null) {
  const query = { 
    "status.isApproved": true,
    "status.isActive": true,
    "location.stateCode": stateCode
  };
  
  if (districtCode) {
    query["location.districtCode"] = districtCode;
  }
  
  return this.find(query)
    .populate('parentUser')
    .sort({ name: 1 });
};

branchSchema.statics.findPendingApproval = function() {
  return this.find({ "status.isApproved": false })
    .populate('parentUser')
    .sort({ createdAt: -1 });
};

branchSchema.statics.findActiveBranches = function() {
  return this.find({ 
    "status.isActive": true, 
    "status.isApproved": true 
  })
    .populate('parentUser')
    .sort({ name: 1 });
};

branchSchema.statics.findByService = function(serviceName) {
  return this.find({ 
    "services.name": serviceName,
    "status.isActive": true,
    "status.isApproved": true
  })
    .populate('parentUser')
    .sort({ name: 1 });
};

// Pre-save middleware
branchSchema.pre('save', function(next) {
  // Şube kodunu otomatik oluştur
  if (!this.code && this.name) {
    const baseCode = this.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 4);
    this.code = `${baseCode}${Date.now().toString().slice(-4)}`;
  }
  
  next();
});

// Pre-remove middleware
branchSchema.pre('remove', async function(next) {
  // İlişkili alt kullanıcıları temizle
  const SubUser = mongoose.model('SubUser');
  await SubUser.updateMany(
    { "assignedBranches.branch": this._id },
    { $pull: { assignedBranches: { branch: this._id } } }
  );
  
  next();
});

module.exports = mongoose.models.Branch || mongoose.model("Branch", branchSchema);
