const axios = require("axios");
const otpVerificationModel = require("../model/otpVerification");
require("dotenv").config();

const SHREESMS_URL = "https://web.shreesms.net/API/SendSMS.aspx";
const SHREESMS_API_KEY = process.env.SHREESMS_API_KEY;
const SHREESMS_SENDER_ID = process.env.SHREESMS_SENDER_ID;  // QUELES
const SHREESMS_ENTITY_ID = process.env.SHREESMS_ENTITY_ID;  // 1701175817292947842
const SHREESMS_TEMPLATE_ID = process.env.SHREESMS_TEMPLATE_ID; // 1707175860554916635
const otpExpiryMinutes = process.env.OTP_EXPIRY_MINUTES || 10;

// Generate a random numeric OTP
function generateOTP(length = 6) {
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
}

async function sendOTP(mobileNumber) {
    const otp = generateOTP();

    // 🚨 MUST match template exactly with {#var#} replaced
    const message = `Login OTP is Test01 for Queueless Mobile App. This will be valid only for 10 min. Please Don't share with anyone -Team Queueless`;

    const url = `${SHREESMS_URL}` +
        `?APIkey=${SHREESMS_API_KEY}` +
        `&SenderID=${SHREESMS_SENDER_ID}` +
        `&SMSType=OTPTransaction` + // Service Implicit
        `&Mobile=${mobileNumber}` +
        `&MsgText=${encodeURIComponent(message)}` +
        `&EntityID=${SHREESMS_ENTITY_ID}` +
        `&TemplateID=${SHREESMS_TEMPLATE_ID}`;

    try {
        const response = await axios.get(url);
        console.log("ShreeSMS Response:", response.data);

        if (response.data.startsWith("ok|")) {
            return { success: true, otp, response: response.data };
        } else {
            return { success: false, otp: null, error: response.data };
        }
    } catch (error) {
        console.error("Error:", error.message);
        return { success: false, otp: null, error: error.message };
    }
}

async function addOtpVerification(mobileNumber, otp) {
    try {
        const otpVerification = new otpVerificationModel({
            mobileNumber,
            otp,
            expiresAt: Date.now() + (otpExpiryMinutes * 60 * 1000), // 10 minutes
        });
        const savedOtpVerification = await otpVerification.save();
        return true;
    } catch (error) {
        console.error("Error:", error.message);
        return false;
    }
}

async function verifyOtpDB(mobileNumber, otp) {
    try {
        const otpVerification = await otpVerificationModel.findOne({ mobileNumber });
        if (!otpVerification) {
            return false;
        }
        if (otpVerification.otp !== otp) {
            return false;
        }
        if (otpVerification.expiresAt < Date.now()) {
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error:", error.message);
        return false;
    }
}

module.exports = {
    generateOTP,
    sendOTP,
    addOtpVerification,
    verifyOtpDB
};
