// /models/appointmentuser.js
const mongoose = require('mongoose');

// general medicine,
// psychiatrist,
// gynaecologist,
// dentist,
// paediatrics,
// general surgeon

const specializationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    create: { type: Date, default: Date.now },
    update: { type: Date, default: Date.now },
    delete: { type: Boolean, default: false },
});

const specialization = mongoose.model('specialization', specializationSchema);

module.exports = specialization;
