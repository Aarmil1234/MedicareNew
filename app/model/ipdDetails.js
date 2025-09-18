// /models/ipd.js
const mongoose = require('mongoose');

const ipdDetailsSchema = new mongoose.Schema({
    
    ipdId: { type: mongoose.Schema.Types.ObjectId, ref: 'ipds', required: true },
    instructions: { type: String, required: false },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctors', required: false},
    create: { type: Date, default: Date.now },
    update: { type: Date, default: Date.now },
    delete: { type: Boolean, default: false },
});

const ipdDetails = mongoose.model('ipdDetails', ipdDetailsSchema);

module.exports = ipdDetails;
