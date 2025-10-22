const mongoose = require("mongoose");
const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  activityTitle: {
    type: String,
    required: true,
  },
  activityDescription: {
    type: String,
    required: true,
  },
  MainCriteria: {
    ref: "MainCriteria",
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  SubCriteria: {
    ref: "SubCriteria",
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  status: {
      type: String,
      enum: ["مرفوض", "قيد المراجعة", "معتمد"],
      default: "قيد المراجعة",
    },
    SaveStatus:{
      type: String,
      enum: ["مسودة", "مكتمل"],
      default: "مكتمل",
    },
    Attachments: [
      {
        type: String,
      },
    ],
  name:{
type:String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("Activity", activitySchema);
