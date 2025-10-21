const express = require("express");
const router = express.Router();
const {
    addMainCriteria,
    addSubCriteria,
    getAllMainCriteria,
    getAllSubCriteria,
    updateMainCriteria,
    updateSubCriteria,
    deleteMainCriteria,
    deleteSubCriteria,
} = require("../controller/Criteria");
router.post("/add-main-criteria", addMainCriteria);
router.post("/add-sub-criteria", addSubCriteria);
router.get("/all-main-criteria", getAllMainCriteria);
router.get("/all-sub-criteria", getAllSubCriteria);
router.put("/update-main-criteria/:id", updateMainCriteria);
router.put("/update-sub-criteria/:id", updateSubCriteria);
router.delete("/delete-main-criteria/:id", deleteMainCriteria);
router.delete("/delete-sub-criteria/:id", deleteSubCriteria);
module.exports = router;
