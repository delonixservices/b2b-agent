const mongoose = require('mongoose');

// Company Schema
const companySchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  agencyName: { type: String },
  numPeople: { type: Number },
  gst: { type: String }, // file path
  docs: [{ type: String }], // file paths
  password: { type: String, required: true },
  companyNumber: { type: Number, unique: true, sparse: true }, // Company's unique number - not required initially
  isActive: { type: Boolean, default: false } // Companies are inactive by default until verified by admin
}, {
  timestamps: true
});

// Employee Schema
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true }, // Global unique employee ID
  name: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  employeeNumber: { type: Number, required: true }, // Employee number within company
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }, // Reference to company
  companyNumber: { type: Number, required: true }, // Company number for easy reference
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Create compound index for employee uniqueness within company
employeeSchema.index({ company: 1, employeeNumber: 1 }, { unique: true });

// Create index for global employeeId uniqueness
employeeSchema.index({ employeeId: 1 }, { unique: true });

// Create index for phone uniqueness in employees
employeeSchema.index({ phone: 1 }, { unique: true });

// Create models
const Company = mongoose.model('Company', companySchema);
const Employee = mongoose.model('Employee', employeeSchema);

module.exports = { Company, Employee }; 