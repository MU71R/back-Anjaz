const user = require("../model/user");
const mainCriteria = require("../model/mainCriteria");
const subCriteria = require("../model/subcriteria");

// add main criteria
const addMainCriteria = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: "الاسم مطلوب" });
        }
        const existingMainCriteria = await MainCriteria.findOne({ name });
        if (existingMainCriteria) {
            return res.status(400).json({ error: " المعايير الرئيسية موجودة بالفعل" });
        }
        const mainCriteria = new MainCriteria({ name });
        await mainCriteria.save();
        res.status(201).json(mainCriteria);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// add sub criteria
const addSubCriteria = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: "الاسم مطلوب" });
        }
        const existingSubCriteria = await SubCriteria.findOne({ name });
        if (existingSubCriteria) {
            return res.status(400).json({ error: " المعايير الفرعية موجودة بالفعل" });
        }
        const subCriteria = new SubCriteria({ name });
        await subCriteria.save();
        res.status(201).json(subCriteria);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// get all main criteria
const getAllMainCriteria = async (req, res) => {
    try {
        const mainCriteria = await MainCriteria.find();
        res.status(200).json(mainCriteria);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// get all sub criteria
const getAllSubCriteria = async (req, res) => {
    try {
        const subCriteria = await SubCriteria.find();
        res.status(200).json(subCriteria);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// update main criteria
const updateMainCriteria = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: "الاسم مطلوب" });
        }
        const mainCriteria = await MainCriteria.findByIdAndUpdate(id, { name }, { new: true });
        res.status(200).json(mainCriteria);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// update sub criteria
const updateSubCriteria = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: "الاسم مطلوب" });
        }
        const subCriteria = await SubCriteria.findByIdAndUpdate(id, { name }, { new: true });
        res.status(200).json(subCriteria);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// delete main criteria
const deleteMainCriteria = async (req, res) => {
    try {
        const { id } = req.params;
        const mainCriteria = await MainCriteria.findByIdAndDelete(id);
        res.status(200).json(mainCriteria);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// delete sub criteria
const deleteSubCriteria = async (req, res) => {
    try {
        const { id } = req.params;
        const subCriteria = await SubCriteria.findByIdAndDelete(id);
        res.status(200).json(subCriteria);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    addMainCriteria,
    addSubCriteria,
    getAllMainCriteria,
    getAllSubCriteria,
    updateMainCriteria,
    updateSubCriteria,
    deleteMainCriteria,
    deleteSubCriteria,
};