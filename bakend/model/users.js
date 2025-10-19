const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    validate: {
      validator: function (v) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
          v
        );
      },
      message:
        "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل وتحتوي على حرف كبير واحد على الأقل وحرف صغير واحد ورقم واحد وحرف خاص واحد",
    },
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  department: {
    type: String,
    required: true,
    unique: true,
  },
  sector: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
});
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
module.exports = mongoose.model("User", userSchema);
