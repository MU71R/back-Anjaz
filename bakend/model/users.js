const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
      validate: {
        validator: function (v) {
          return !v || /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email`,
      },
    },
    password: {
        type: String,
        validate: {
            validator: function (v) {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
            },
            message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        },
        required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
});
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  });
module.exports = mongoose.model("User", userSchema);

