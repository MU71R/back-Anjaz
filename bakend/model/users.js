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
    required: function () {
        return this.username;
      }
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
    required: function () {
        return this.username;
      },
  },
  role: {
    type: String,
    enum: ["user", "admin"],
  },
  sector: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
module.exports = mongoose.model("User", userSchema);
