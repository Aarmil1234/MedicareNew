// cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: 'dvuqceiek',
    api_key: '588337549493347',
    api_secret: 'R7Jdi98Llv0dV0OznUgatXTPMdQ'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploads', // Optional: Folder in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

module.exports = {
    cloudinary,
    storage,
};
