const express = require("express");
const router = express.Router();
const { verifyTokenMiddleware, isAdmin, authorizeOwnerOrAdmin } = require("../middleware/auth");
const {
  addactivity,
  getallactivities,
  updateActivityStatus,
  getActivityById,
  deleteActivity,
  updateActivity,
  getarchivedActivities,
  getdraftActivities,
  search,
  filterByStatus
} = require("../controller/activity");

router.post("/add", verifyTokenMiddleware, addactivity);
router.get("/all", verifyTokenMiddleware, getallactivities);
router.get("/:id", verifyTokenMiddleware, getActivityById);
router.get("/archived", verifyTokenMiddleware, getarchivedActivities);
router.get("/draft", verifyTokenMiddleware, getdraftActivities);
router.get("/search", verifyTokenMiddleware, search);
router.get("/filter", verifyTokenMiddleware, filterByStatus);
router.put("/update-status/:id", verifyTokenMiddleware, updateActivityStatus);
router.put("/update/:id", verifyTokenMiddleware, updateActivity);
router.delete("/delete/:id", verifyTokenMiddleware, deleteActivity);
module.exports = router;
