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
  viewPDF,
  recentAchievements,
  updateDraftActivities,
  deleteDraftActivities,
  getdraftActivitiesById,
  viewDOCX,
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

router.get("/:id", verifyTokenMiddleware, getActivityById);
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
router.get("/pdf/:filename", verifyTokenMiddleware, viewPDF);
router.get("/docx/:filename", verifyTokenMiddleware, viewDOCX);
module.exports = router;
