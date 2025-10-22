const express = require("express");
const router = express.Router();
const { verifyTokenMiddleware, isAdmin, authorizeOwnerOrAdmin } = require("../middleware/auth");
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
router.post("/add-main-criteria", verifyTokenMiddleware, addMainCriteria);
router.post("/add-sub-criteria", verifyTokenMiddleware, addSubCriteria);
router.get("/all-main-criteria", verifyTokenMiddleware, getAllMainCriteria);
router.get("/all-sub-criteria", verifyTokenMiddleware, getAllSubCriteria);
router.put("/update-main-criteria/:id", verifyTokenMiddleware, updateMainCriteria);
router.put("/update-sub-criteria/:id", verifyTokenMiddleware, updateSubCriteria);
router.delete("/delete-main-criteria/:id", verifyTokenMiddleware, deleteMainCriteria);
router.delete("/delete-sub-criteria/:id", verifyTokenMiddleware, deleteSubCriteria);
module.exports = router;
