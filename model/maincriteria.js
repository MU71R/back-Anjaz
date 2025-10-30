// models/MainCriteria.js
const mongoose = require("mongoose");

const MainCriteriaSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  level: {
    type: String,
    enum: ["ALL", "SECTOR", "DEPARTMENT"],
    required: true,
  },
  sector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sector",
    default: null,
  },
  departmentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});

MainCriteriaSchema.virtual("subCriteria", {
  ref: "SubCriteria",
  localField: "_id",
  foreignField: "mainCriteria",
});

MainCriteriaSchema.set("toObject", { virtuals: true });
MainCriteriaSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("MainCriteria", MainCriteriaSchema);
