const mongoose = require("mongoose");

const PostSocial3Schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSocial3",
      required: true,
    },
    desc: {
      type: String,
      required: true,
      min: 8,
    },
    photo: {
      type: String,
      default: "",
    },
    likes: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const PostSocial3 = mongoose.model("PostSocial3", PostSocial3Schema);
module.exports = PostSocial3;
