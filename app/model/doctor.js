const mongoose = require('mongoose');

const workingHourSchema = new mongoose.Schema({
    start: { type: String, required: false },      // e.g. "09:00"
    end: { type: String, required: false },        // e.g. "17:00"
    isAvailable: { type: Boolean, default: true }, // availability flag
}, { _id: false }); // don’t create _id for subdocs

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: false },
    mobileNumber: { type: String, required: false },
    specializationId: { type: String, required: false },
    degreeId: { type: String, required: false },
    hospitalId: { type: String, required: false },
    address: { type: String, required: false },

    appointmentCharge: { type: String, required: false },
    averageAppointmentTime: { type: Number, required: false },

    experience: { type: String, required: false },
    profile: { type: String, required: false },

    age: { type: String, required: true },
    gender: { type: String, required: true },

    workingHours: {
        monday: { type: workingHourSchema, default: {} },
        tuesday: { type: workingHourSchema, default: {} },
        wednesday: { type: workingHourSchema, default: {} },
        thursday: { type: workingHourSchema, default: {} },
        friday: { type: workingHourSchema, default: {} },
        saturday: { type: workingHourSchema, default: {} },
        sunday: { type: workingHourSchema, default: {} },
    },
    
    create: { type: Date, default: Date.now },
    update: { type: Date, default: Date.now },
    delete: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
});

const doctor = mongoose.model('doctor', doctorSchema);

module.exports = doctor;
