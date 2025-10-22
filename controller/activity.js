const activitymodel = require("../model/activity");
const { getIo } = require("../socket");
const Notification = require("../model/notifications");

const addactivity = async (req, res) => {
  try {
    const {
      activityTitle,
      activityDescription,
      SubCriteria,
      MainCriteria,
      Attachments,
      name,
    } = req.body;
    const newActivity = new activitymodel({
      user: req.user._id,
      activityTitle,
      activityDescription,
      MainCriteria,
      SubCriteria,
      Attachments,
      name,
    });
    const errors = {};
    const requirefields = [
      activityTitle,
      activityDescription,
      MainCriteria,
      SubCriteria,
    ];
    for (const field of requirefields) {
      if (!field) {
        errors[field] = `${field} مطلوب`;
      }
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    await newActivity.save();
    const io = getIo();
    io.emit("newActivity", newActivity);
    const notification = new Notification({
      message: `تم إضافة نشاط جديد: ${newActivity.activityTitle}`,
      activity: newActivity._id,
    });
    await notification.save();

    res.status(201).json({
      success: true,
      message: "تم اضافة النشاط",
      activity: newActivity,
    });
  } catch (error) {
    console.error("خطأ في اضافة النشاط:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في الخادم الداخلي".error.message,
    });
  }
};
const getallactivities = async (req, res) => {
  try {
    const activities = await activitymodel
      .find()
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");
    res.status(200).json({ success: true, activities });
  } catch (error) {
    console.error("خطأ في جلب النشاطات:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
const getActivityById = async (req, res) => {
  try {
    const activityId = req.params.id;
    const activity = await activitymodel
      .findById(activityId)
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");
    if (!activity) {
      return res
        .status(404)
        .json({ success: false, message: "النشاط غير موجود" });
    }
    res.status(200).json({ success: true, activity });
  } catch (error) {
    console.error("خطأ في جلب النشاط:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
const updateActivityStatus = async (req, res) => {
  try {
    const activityId = req.params.id;
    const { status } = req.body;
    const validStatuses = ["مرفوض", "قيد المراجعة", "معتمد"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "حالة غير صالحة" });
    }
    const activity = await activitymodel.findByIdAndUpdate(
      activityId,
      { status },
      { new: true }
    );
    if (!activity) {
      return res
        .status(404)
        .json({ success: false, message: "النشاط غير موجود" });
    }
    await activity.save();
    const io = getIo();
    io.emit("updateActivity", activity);
    const notification = new Notification({
      message: `تم تحديث النشاط: ${activity.activityTitle}`,
      activity: activity._id,
    });
    await notification.save();
    res
      .status(200)
      .json({ success: true, message: "تم تحديث حالة النشاط", activity });
  } catch (error) {
    console.error("خطأ في تحديث حالة النشاط:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
const updateActivity = async (req, res) => {
  try {
    const activityId = req.params.id;
    const updates = req.body;
    const activity = await activitymodel.findByIdAndUpdate(
      activityId,
      updates,
      { new: true }
    );
    if (!activity) {
      return res
        .status(404)
        .json({ success: false, message: "النشاط غير موجود" });
    }
    await activity.save();
    res
      .status(200)
      .json({ success: true, message: "تم تحديث النشاط", activity });
  } catch (error) {
    console.error("خطأ في تحديث النشاط:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
const deleteActivity = async (req, res) => {
  try {
    const activityId = req.params.id;
    const activity = await activitymodel.findByIdAndDelete(activityId);
    if (!activity) {
      return res
        .status(404)
        .json({ success: false, message: "النشاط غير موجود" });
    }
    res.status(200).json({ success: true, message: "تم حذف النشاط", activity });
  } catch (error) {
    console.error("خطأ في حذف النشاط:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
const getarchivedActivities = async (req, res) => {
  try {
    const archivedActivities = await activitymodel
      .find({ status: "معتمد" })
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");
    res.status(200).json({ success: true, data: archivedActivities });
  } catch (error) {
    console.error("خطأ في جلب النشاطات المحفوظة:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
const getdraftActivities = async (req, res) => {
  try {
    const draftActivities = await activitymodel
      .find({ SaveStatus: "مسودة" })
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");
    res.status(200).json({ success: true, data: draftActivities });
  } catch (error) {
    console.error("خطأ فى جلب المسودات", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
const search = async (req, res) => {
  try {
    const { query } = req.query;
    const activities = await activitymodel
      .find()
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name")
      .find({
        $or: [
          { activityTitle: { $regex: query, $options: "i" } },
          { activityDescription: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } },
          { user: { $regex: query, $options: "i" } },
        ],
      });
    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    console.error("خطأ في البحث عن النشاطات:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
const filterByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const activities = await activitymodel.find({ status: status });
    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    console.error("خطأ في تصفية النشاطات:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
module.exports = {
  addactivity,
  getallactivities,
  getActivityById,
  updateActivityStatus,
  updateActivity,
  deleteActivity,
  getarchivedActivities,
  getdraftActivities,
  search,
  filterByStatus,
};
