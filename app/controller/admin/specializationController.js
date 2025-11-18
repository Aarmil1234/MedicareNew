const SpecializationModel = require('../../model/specialization');
const { successResponse, errorResponse } = require('../../helper/index');

const addSpecialization = async (req, res) => {
    try {
        const { name } = req.body;
        const newSpecialization = new SpecializationModel({ name });
        await newSpecialization.save();
        return successResponse(res, 'Specialization added successfully');
    } catch (error) {
        console.error('Error adding specialization:', error);
        return errorResponse(res, 'Error adding specialization');
    }
};

const getAllSpecializations = async (req, res) => {
    try {
        const specializations = await SpecializationModel.find();
        return successResponse(res, 'Specializations fetched successfully', specializations);
    } catch (error) {
        console.error('Error fetching specializations:', error);
        return errorResponse(res, 'Error fetching specializations');
    }
};

const editSpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        await SpecializationModel.findByIdAndUpdate(id, { name });
        return successResponse(res, 'Specialization updated successfully');
    } catch (error) {
        console.error('Error updating specialization:', error);
        return errorResponse(res, 'Error updating specialization');
    }
};

const deleteSpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        await SpecializationModel.findByIdAndDelete(id);
        return successResponse(res, 'Specialization deleted successfully');
    } catch (error) {
        console.error('Error deleting specialization:', error);
        return errorResponse(res, 'Error deleting specialization');
    }
};

module.exports = {
    addSpecialization,
    getAllSpecializations,
    editSpecialization,
    deleteSpecialization
};
