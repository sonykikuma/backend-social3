const verifyToken = require("../middlewares/verifyToken");
const PostSocial3 = require("../models/PostSocial3");
const UserSocial3 = require("../models/UserSocial3");
const postRoute = require("express").Router();
const mongoose = require("mongoose");

// get user posts
postRoute.get("/find/userposts/:id", async (req, res) => {
  try {
    const posts = await PostSocial3.find({ user: req.params.id }).populate(
      "user",
      "-password"
    ); //populated user data

    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

// get timeline posts
postRoute.get("/timeline/posts", verifyToken, async (req, res) => {
  try {
    const currentUser = await UserSocial3.findById(req.user.id);
    const posts = await PostSocial3.find({}).populate("user", "-password");
    const currentUserPosts = await PostSocial3.find({
      user: currentUser._id,
    }).populate("user", "-password");
    const friendsPosts = posts.filter((post) => {
      return currentUser.followings.includes(post.user._id);
    });

    let timelinePosts = currentUserPosts.concat(...friendsPosts);

    if (timelinePosts.length > 40) {
      timelinePosts = timelinePosts.slice(0, 40);
    }

    return res.status(200).json(timelinePosts);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});
// get one
postRoute.get("/find/:id", async (req, res) => {
  try {
    let post = await PostSocial3.findById(req.params.id).populate(
      "user",
      "-password"
    );
    if (!post) {
      return res.status(404).json({ msg: "No such post with this id FOUND!" });
    } else {
      return res.status(200).json(post);
    }
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

// create
postRoute.post("/", verifyToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const newPost = await PostSocial3.create({ ...req.body, user: userId });

    return res.status(201).json(newPost);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

// update
postRoute.put("/:id", verifyToken, async (req, res) => {
  try {
    const post = await PostSocial3.findById(req.params.id);

    if (post.user.toString() === req.user.id.toString()) {
      const updatedPost = await PostSocial3.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      return res.status(200).json(updatedPost);
    }
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

// delete
postRoute.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await PostSocial3.findById(req.params.id).populate(
      "user",
      "-password"
    );
    if (!post) {
      return res.status(404).json({ msg: "No such post Found" });
    } else if (post.user._id.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ msg: "You can delete only your own posts" });
    } else {
      await PostSocial3.findByIdAndDelete(req.params.id);
      return res.status(200).json({ msg: "Post is successfully deleted" });
    }
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

// like
postRoute.put("/toggleLike/:id", verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const post = await PostSocial3.findById(req.params.id);

    if (post.likes.includes(currentUserId)) {
      post.likes = post.likes.filter((id) => id !== currentUserId);
      await post.save();
      return res.status(200).json({ msg: "Successfully unliked the post" });
    } else {
      post.likes.push(currentUserId);
      await post.save();
      return res.status(200).json({ msg: "Successfully liked the post" });
    }
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

module.exports = postRoute;

//     "desc": "my post 1",
//"location":"France",
//"photo":"https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=800"
