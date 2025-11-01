const express = require("express");
const router = express.Router();
const {
  verifyTokenMiddleware,
  isAdmin,
  authorizeOwnerOrAdmin,
} = require("../middleware/auth");
const upload = require("../utils/multer");
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
  filterByStatus,
  recentAchievements,
  updateDraftActivities,
  deleteDraftActivities,
  getdraftActivitiesById,
  generateAllActivitiesPDF,
} = require("../controller/activity");

router.post(
  "/add",
  verifyTokenMiddleware,
  upload.array("Attachments"),
  addactivity
);
router.get("/all", verifyTokenMiddleware, getallactivities);
router.get("/archived", verifyTokenMiddleware, getarchivedActivities);
router.get("/draft", verifyTokenMiddleware, getdraftActivities);
router.get("/search", verifyTokenMiddleware, search);
router.get("/filter", verifyTokenMiddleware, filterByStatus);
router.get("/recent-achievements", verifyTokenMiddleware, recentAchievements);

router.put("/update-status/:id", verifyTokenMiddleware, updateActivityStatus);
router.put("/update/:id", verifyTokenMiddleware, updateActivity);
router.delete("/delete/:id", verifyTokenMiddleware, deleteActivity);
router.put(
  "/update-draft/:id",
  verifyTokenMiddleware,
  upload.array("Attachments"),
  updateDraftActivities
);
router.delete(
  "/delete-draft/:id",
  verifyTokenMiddleware,
  deleteDraftActivities
);
router.get("/draft/:id", verifyTokenMiddleware, getdraftActivitiesById);
router.get("/generate-pdf", verifyTokenMiddleware, generateAllActivitiesPDF);
router.get("/:id", verifyTokenMiddleware, getActivityById);

module.exports = router;
