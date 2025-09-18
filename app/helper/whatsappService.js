// whatsappService.js
const axios = require("axios");
require('dotenv').config();

const AISENSY_URL = "https://backend.aisensy.com/campaign/t1/api/v2";

const API_KEY = process.env.WHATSAPP_API_KEY;

async function sendWhatsAppMessages(appointmentType, numbers, data) {
  // Mapping appointmentType to campaignName & params
  let campaignName = "";
  let templateParams = [];

  switch (appointmentType) {
    case "newAppointment":
      campaignName = "appointment_booked";
      templateParams = [
        data.patientName,
        data.doctorName,
        data.hospitalAddress,
        data.bookingTime
      ];
      break;

    case "deleteAppointment":
      campaignName = "appointment_cancel"; 
      templateParams = [
        data.patientName,
        data.doctorName,
        data.hospitalAddress,
        data.bookingTime
      ];
      break;

    case "reminderAppointment":
      campaignName = "appointment_reminder"; 
      templateParams = [
        data.patientName,
        data.doctorName,
        data.hospitalAddress,
        data.bookingTime
      ];
      break;

    case "shiftAppointment":
      campaignName = "  "; 
      templateParams = [
        data.patientName,
        data.doctorName,
        data.hospitalAddress,
        data.bookingTime
      ];
      break;

    default:
      campaignName = "appointment_booked";
      templateParams = [
        data.patientName,
        data.doctorName,
        data.hospitalAddress,
        data.bookingTime
      ];
      break;
  }
  for (const number of numbers) {
    try {
      const payload = {
        apiKey: API_KEY,
        campaignName: campaignName,
        destination: number,
        userName: "Creative developers",
        templateParams: templateParams,
        source: "new-landing-page form",
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue: {
          patientName: "User",
          doctorName: "Doctor",
          hospitalAddress: "Hospital",
          bookingTime: "Time"
        }
      };

      const response = await axios.post(AISENSY_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log(`Message sent to ${number}`, response.data);
    } catch (error) {
      console.error(`Error sending to ${number}`, error.response?.data || error.message);
    }
  }
}

module.exports = { sendWhatsAppMessages };
