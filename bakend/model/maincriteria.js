const mongoose = require("mongoose");

const MainCriteriaSchema = new mongoose.Schema({
  name: { type: String, required: true ,unique:true},
});

module.exports = mongoose.model("MainCriteria", MainCriteriaSchema);
