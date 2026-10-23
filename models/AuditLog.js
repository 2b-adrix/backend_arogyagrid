const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  logId: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  actionType: { type: String, required: true },
  performedBy: { type: String, required: true },
  details: { type: String }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
