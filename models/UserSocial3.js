const mongoose = require("mongoose");

const UserSocial3Schema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
    },
    profileImg: {
      type: String,
      default: "",
    },
    followings: {
      type: [String],
      default: [],
    },
    followers: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      default: "",
    },
    bookmarkedPosts: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

const UserSocial3 = mongoose.model("UserSocial3", UserSocial3Schema);
module.exports = UserSocial3;
