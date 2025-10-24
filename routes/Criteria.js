const express = require("express");
const router = express.Router();
const { verifyTokenMiddleware, isAdmin, authorizeOwnerOrAdmin } = require("../middleware/auth");
const {
  addMainCriteria,
  addSubCriteria,
  getAllMainCriteria,
  getAllSubCriteria,
  updateMainCriteriaPartial,
  updateSubCriteria,
  deleteMainCriteria,
  deleteSubCriteria,
} = require("../controller/Criteria");
router.post("/add-main-criteria", verifyTokenMiddleware, isAdmin, addMainCriteria);
router.post("/add-sub-criteria", verifyTokenMiddleware, isAdmin, addSubCriteria);
router.get("/all-main-criteria", verifyTokenMiddleware, getAllMainCriteria);
router.get("/all-sub-criteria", verifyTokenMiddleware, getAllSubCriteria);
router.put("/update-main-criteria/:id", verifyTokenMiddleware, isAdmin, updateMainCriteriaPartial);
router.put("/update-sub-criteria/:id", verifyTokenMiddleware, isAdmin, updateSubCriteria);
router.delete("/delete-main-criteria/:id", verifyTokenMiddleware, isAdmin, deleteMainCriteria);
router.delete("/delete-sub-criteria/:id", verifyTokenMiddleware, isAdmin, deleteSubCriteria);
module.exports = router;
