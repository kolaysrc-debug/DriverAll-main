// PATH: DriverAll-main/drivercv-backend/models/SubUser.js
// ----------------------------------------------------------
// Alt Kullanıcı Modeli
// - İşletme ve admin alt kullanıcıları
// - Yetki kısıtlamaları
// - Onay sistemi
// ----------------------------------------------------------

const mongoose = require("mongoose");
const { Schema } = mongoose;

// Yetki şeması
const permissionSchema = new Schema({
  module: { type: String, required: true }, // profile, jobs, ads, users, branches, etc.
  actions: [{
    action: { type: String, required: true }, // create, read, update, delete
    allowed: { type: Boolean, default: false },
    restrictions: {
      ownOnly: { type: Boolean, default: false },
      locationBased: { type: Boolean, default: false },
      branchBased: { type: Boolean, default: false },
      custom: { type: Schema.Types.Mixed }
    }
  }]
}, { _id: false });

// Lokasyon kısıtlaması şeması
const locationRestrictionSchema = new Schema({
  type: { 
    type: String, 
    enum: ["none", "country", "state", "district", "branch", "custom"], 
    default: "none" 
  },
  allowedCountries: [{ type: String, trim: true }],
  allowedStates: [{ type: String, trim: true }],
  allowedDistricts: [{ type: String, trim: true }],
  allowedBranches: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
  customAreas: [{
    name: { type: String, required: true },
    description: { type: String },
    locationCodes: [{ type: String }]
  }]
}, { _id: false });

// Ana alt kullanıcı şeması
const subUserSchema = new Schema({
  // Ana kullanıcı bağlantısı
  parentUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  // Alt kullanıcı bilgileri
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  passwordHash: { type: String, required: true },
  
  // Rol bilgisi
  role: {
    type: Schema.Types.ObjectId,
    ref: "Role",
    required: true,
    index: true
  },
  
  // Şube atamaları
  assignedBranches: [{
    branch: { type: Schema.Types.ObjectId, ref: "Branch" },
    isPrimary: { type: Boolean, default: false },
    permissions: [String] // şube özel yetkiler
  }],

  assignedUnits: [{
    unit: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Yetkiler
  permissions: [permissionSchema],
  
  // Lokasyon kısıtlamaları
  locationRestrictions: locationRestrictionSchema,
  
  // Durum ve onay
  status: {
    isActive: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    approvalDate: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
    lastLogin: { type: Date },
    passwordResetRequired: { type: Boolean, default: true }
  },

  approvalSettings: {
    requireOwnerApproval: { type: Boolean, default: false },
    requireActionApproval: { type: Boolean, default: false }
  },
  
  // Profil bilgileri
  profile: {
    avatar: { type: String },
    title: { type: String, trim: true }, // unvan
    department: { type: String, trim: true }, // departman
    about: { type: String, trim: true }
  },
  
  // İletişim bilgileri
  contact: {
    workPhone: { type: String, trim: true },
    mobilePhone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true }
  },
  
  // Aktivite log
  activityLog: [{
    action: { type: String, required: true },
    description: { type: String },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String }
  }],
  
  // Meta veriler
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    source: { type: String, default: "admin" }, // admin, business, api
    notes: { type: String, trim: true }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
subUserSchema.virtual('roleData', {
  ref: 'Role',
  localField: 'role',
  foreignField: '_id',
  justOne: true
});

subUserSchema.virtual('parentUserData', {
  ref: 'User',
  localField: 'parentUser',
  foreignField: '_id',
  justOne: true
});

subUserSchema.virtual('primaryBranch', {
  ref: 'Branch',
  localField: 'assignedBranches.branch',
  foreignField: '_id',
  justOne: true,
  match: { isPrimary: true }
});

subUserSchema.virtual('isBusinessSubUser').get(function() {
  return this.roleData?.category === 'business';
});

subUserSchema.virtual('isAdminSubUser').get(function() {
  return this.roleData?.category === 'admin';
});

// Indexes
subUserSchema.index({ parentUser: 1 });
subUserSchema.index({ email: 1 });
subUserSchema.index({ role: 1 });
subUserSchema.index({ "status.isActive": 1 });
subUserSchema.index({ "status.isApproved": 1 });
subUserSchema.index({ assignedBranches: 1 });

// Methods
subUserSchema.methods.hasPermission = function(module, action, context = {}) {
  // Global yetkileri kontrol et
  const globalPerms = this.permissions.find(p => p.module === module);
  if (globalPerms) {
    const actionPerm = globalPerms.actions.find(a => a.action === action);
    if (actionPerm?.allowed) {
      // Kısıtlamaları kontrol et
      if (actionPerm.restrictions.ownOnly && context.userId !== this._id.toString()) {
        return false;
      }
      if (actionPerm.restrictions.locationBased && context.locationCode) {
        return this.checkLocationAccess(context.locationCode);
      }
      if (actionPerm.restrictions.branchBased && context.branchId) {
        return this.checkBranchAccess(context.branchId);
      }
      return true;
    }
  }
  
  // Şube yetkilerini kontrol et
  if (context.branchId) {
    const branchAssignment = this.assignedBranches.find(ab => 
      ab.branch.toString() === context.branchId.toString()
    );
    if (branchAssignment) {
      return branchAssignment.permissions.includes(`${module}.${action}`);
    }
  }
  
  return false;
};

subUserSchema.methods.checkLocationAccess = function(locationCode) {
  const restrictions = this.locationRestrictions;
  
  if (restrictions.type === "none") return true;
  if (restrictions.type === "country") return true;
  
  if (restrictions.type === "state" && restrictions.allowedStates.length > 0) {
    return restrictions.allowedStates.some(code => locationCode.startsWith(code));
  }
  
  if (restrictions.type === "district" && restrictions.allowedDistricts.length > 0) {
    return restrictions.allowedDistricts.includes(locationCode);
  }
  
  if (restrictions.type === "branch" && restrictions.allowedBranches.length > 0) {
    // Branch-based location check
    return true; // implement branch location mapping
  }
  
  return false;
};

subUserSchema.methods.checkBranchAccess = function(branchId) {
  if (this.assignedBranches.length === 0) return false;
  
  return this.assignedBranches.some(ab => 
    ab.branch.toString() === branchId.toString()
  );
};

subUserSchema.methods.addActivityLog = function(action, description, metadata = {}) {
  this.activityLog.push({
    action,
    description,
    timestamp: new Date(),
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent
  });
  
  // Son 100 log'u tut
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100);
  }
  
  return this;
};

subUserSchema.methods.approve = function(approvedBy, notes = "") {
  this.status.isApproved = true;
  this.status.approvalDate = new Date();
  this.status.approvedBy = approvedBy;
  this.status.isActive = true;
  this.metadata.notes = notes;
  
  this.addActivityLog("approved", `Alt kullanıcı onaylandı. Not: ${notes}`);
  
  return this;
};

subUserSchema.methods.reject = function(rejectedBy, reason) {
  this.status.isApproved = false;
  this.status.rejectionReason = reason;
  
  this.addActivityLog("rejected", `Alt kullanıcı reddedildi. Sebep: ${reason}`);
  
  return this;
};

subUserSchema.methods.activate = function(activatedBy) {
  this.status.isActive = true;
  this.addActivityLog("activated", "Alt kullanıcı aktif edildi");
  
  return this;
};

subUserSchema.methods.deactivate = function(deactivatedBy, reason) {
  this.status.isActive = false;
  this.addActivityLog("deactivated", `Alt kullanıcı pasif edildi. Sebep: ${reason}`);
  
  return this;
};

// Static methods
subUserSchema.statics.findByParentUser = function(parentUserId) {
  return this.find({ parentUser: parentUserId })
    .populate('role')
    .populate('assignedBranches.branch')
    .sort({ createdAt: -1 });
};

subUserSchema.statics.findByRole = function(roleId) {
  return this.find({ role: roleId })
    .populate('parentUser')
    .populate('role')
    .sort({ createdAt: -1 });
};

subUserSchema.statics.findPendingApproval = function() {
  return this.find({ "status.isApproved": false })
    .populate('parentUser')
    .populate('role')
    .sort({ createdAt: -1 });
};

subUserSchema.statics.findActiveUsers = function() {
  return this.find({ 
    "status.isActive": true, 
    "status.isApproved": true 
  })
    .populate('parentUser')
    .populate('role')
    .sort({ lastLogin: -1 });
};

subUserSchema.statics.findByBranch = function(branchId) {
  return this.find({ 
    "assignedBranches.branch": branchId,
    "status.isActive": true,
    "status.isApproved": true
  })
    .populate('parentUser')
    .populate('role')
    .sort({ name: 1 });
};

// Pre-save middleware
subUserSchema.pre('save', function(next) {
  if (this.isModified('status.isActive') && this.status.isActive) {
    this.status.lastLogin = new Date();
  }
  next();
});

module.exports = mongoose.models.SubUser || mongoose.model("SubUser", subUserSchema);
