const mongoose = require("mongoose");
const SubCriteriaSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  mainCriteria: { type: mongoose.Schema.Types.ObjectId, ref: "MainCriteria", required: true }
});

module.exports = mongoose.model("SubCriteria", SubCriteriaSchema);