const moment = require("moment");
const appointmentdetailModel = require("../model/appointmentdetail");
const { sendWhatsAppMessages } = require("./whatsappService");
const appointmentModel = require("../model/appointment");
const mongoose = require("mongoose");

// Generate slots for a given day & doctor (simple fixed range)
function generateSlotsForDoctor(appointmentDate, avgSlotDuration, startTime = "13:00", endTime = "18:00") {
    let slots = [];
    let current = moment(`${moment(appointmentDate).format("YYYY-MM-DD")} ${startTime}`, "YYYY-MM-DD HH:mm");
    let end = moment(`${moment(appointmentDate).format("YYYY-MM-DD")} ${endTime}`, "YYYY-MM-DD HH:mm");

    while (current.isBefore(end)) {
        slots.push(current.format("HH:mm"));
        current.add(avgSlotDuration, "minutes");
    }
    return slots;
}

// Add minutes to a HH:mm time string
function addMinutes(time, minutes) {
    return moment(time, "HH:mm").add(minutes, "minutes").format("HH:mm");
}

// Check if a slot is within patient’s availability range
function isWithinRange(slot, availableStartTime, availableEndTime) {
    const slotMoment = moment(slot, "HH:mm");
    const startMoment = moment(availableStartTime, "HH:mm");
    const endMoment = moment(availableEndTime, "HH:mm");
    return slotMoment.isSameOrAfter(startMoment) && slotMoment.isBefore(endMoment);
}


async function shiftAppointments(doctorId, appointmentDate, startTime, endTime, avgSlotDuration = 30) {
    // 1. Fetch all non-deleted appointments for that doctor & date
    let appointments = await appointmentdetailModel.find({
        doctorId,
        appointmentDate,
        startTime,
        endTime,
        delete: false
    }).sort({ appointmentTime: 1 });

    if (!appointments.length) return;

    // 2. Convert times to minutes since midnight for easier calculations
    const parseTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    let currentTime = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    const slotDuration = Math.min(avgSlotDuration, endMinutes - currentTime); // Ensure we don't exceed the time range

    if (slotDuration <= 0) return; // Invalid time range

    // 3. Generate time slots considering the exact duration
    const slots = [];
    while (currentTime + slotDuration <= endMinutes) {
        const hours = Math.floor(currentTime / 60).toString().padStart(2, '0');
        const minutes = (currentTime % 60).toString().padStart(2, '0');
        slots.push(`${hours}:${minutes}`);
        currentTime += slotDuration;
    }

    if (slots.length === 0) return; // No valid slots found

    // 4. Sort appointments by original time
    appointments.sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));

    // 5. Assign appointments to slots
    for (let i = 0; i < Math.min(slots.length, appointments.length); i++) {
        const slot = slots[i];
        const appt = appointments[i];

        // Update the appointment with the new time slot
        await appointmentdetailModel.findByIdAndUpdate(
            appt._id,
            {
                $set: {
                    appointmentTime: slot,
                    update: new Date()
                }
            }
        );

        const appointmentDetails = await getAppointmentDetails(appt.appointmentId);
        const bookingTimeForWhatsApp = formatBookingTime(appointmentDetails.appointmentDate, appointmentDetails.appointmentTime);
        const whatsappMessageData = {
            patientName: appointmentDetails.patient.fullName,
            doctorName: appointmentDetails.doctor.name,
            hospitalAddress: appointmentDetails.hospital.address + ", " + appointmentDetails.hospital.city + ", " + appointmentDetails.hospital.state + ", " + appointmentDetails.hospital.pincode,
            bookingTime: bookingTimeForWhatsApp
        }
        await sendWhatsAppMessages("shiftAppointment", [appt.mobileNumber], whatsappMessageData);
        console.log(`Updated appointment ${appt._id} to slot ${slot}`);
    }
}

function formatBookingTime(bookingDate, bookingTime) {
    // Convert date into "12-July" format
    const dateObj = new Date(bookingDate);
    const options = { day: '2-digit', month: 'long', year: 'numeric' }; // Example: 10 September 2025
    const formattedDate = dateObj.toLocaleDateString('en-GB', options);

    bookingTime = moment(bookingTime, "HH:mm").format("hh:mm A");

    // Final booking datetime string
    const bookingTimeForWhatsApp = `${formattedDate} at ${bookingTime}`;
    return bookingTimeForWhatsApp;
}

const getAppointmentDetails = async (appointmentId) => {
    try {
        const result = await appointmentModel.aggregate([
            // Match the appointment
            { $match: { _id: new mongoose.Types.ObjectId(appointmentId) } },
            
            // Lookup appointment details
            {
                $lookup: {
                    from: 'appointmentdetails',
                    localField: '_id',
                    foreignField: 'appointmentId',
                    as: 'appointmentDetails'
                }
            },
            { $unwind: '$appointmentDetails' },
            
            // Lookup user (patient) information
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'patient'
                }
            },
            { $unwind: '$patient' },
            
            // Lookup doctor information
            {
                $lookup: {
                    from: 'doctors',
                    localField: 'doctorId',
                    foreignField: '_id',
                    as: 'doctor'
                }
            },
            { $unwind: '$doctor' },
            
            // Lookup hospital information
            {
                $lookup: {
                    from: 'hospitals',
                    localField: 'hospitalId',
                    foreignField: '_id',
                    as: 'hospital'
                }
            },
            { $unwind: '$hospital' },
            
            // Project only necessary fields
            {
                $project: {
                    _id: 1,
                    appointmentDate: '$appointmentDetails.appointmentDate',
                    appointmentTime: '$appointmentDetails.appointmentTime',
                    status: '$appointmentDetails.status',
                    isEmergency: '$appointmentDetails.isEmergency',
                    disease: '$appointmentDetails.disease',
                    chiefComplaints: '$appointmentDetails.chiefComplaints',
                    probableDiagnosis: '$appointmentDetails.probableDiagnosis',
                    doctorRemarks: '$appointmentDetails.doctorRemarks',
                    
                    patient: {
                        _id: '$patient._id',
                        fullName: '$patient.fullName',
                        mobileNumber: '$patient.mobileNumber',
                        email: '$patient.email',
                        gender: '$patient.gender',
                        dob: '$patient.dob'
                    },
                    
                    doctor: {
                        _id: '$doctor._id',
                        name: '$doctor.name',
                        specialization: '$doctor.specialization',
                        mobileNumber: '$doctor.mobileNumber',
                        email: '$doctor.email'
                    },
                    
                    hospital: {
                        _id: '$hospital._id',
                        name: '$hospital.name',
                        address: '$hospital.address',
                        city: '$hospital.city',
                        state: '$hospital.state',
                        pincode: '$hospital.pincode',
                        mobileNumber: '$hospital.mobileNumber'
                    }
                }
            }
        ]);
        
        return result[0] || null;
    } catch (error) {
        console.error('Error fetching appointment details:', error);
        throw error;
    }
};

module.exports = { shiftAppointments, formatBookingTime, getAppointmentDetails };
