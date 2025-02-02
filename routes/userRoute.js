const userRoute = require("express").Router();

const UserSocial3 = require("../models/UserSocial3");
const bcrypt = require("bcryptjs");
const PostSocial3 = require("../models/PostSocial3");
const verifyToken = require("../middlewares/verifyToken");

//get users
userRoute.get("/find/suggestedUsers", verifyToken, async (req, res) => {
  console.log(req.user);
  try {
    const currentUser = await UserSocial3.findById(req.user.id);
    const users = await UserSocial3.find({}).select("-password");
    // if we do not follow this user and if the user is not currentUser
    let suggestedUsers = users.filter((user) => {
      return (
        !currentUser.followings.includes(user._id) &&
        user._id.toString() !== currentUser._id.toString()
      );
    });

    if (suggestedUsers.length > 10) {
      suggestedUsers = suggestedUsers.slice(0, 8);
    }

    return res.status(200).json(suggestedUsers);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});
//get friends
userRoute.get("/find/friends", verifyToken, async (req, res) => {
  try {
    const currentUser = await UserSocial3.findById(req.user.id);
    console.log(currentUser.followings);
    const friends = await Promise.all(
      currentUser.followings.map((friendId) => {
        return UserSocial3.findById(friendId).select("-password");
      })
    );

    console.log(friends);

    return res.status(200).json(friends);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

//get one
userRoute.get("/find/:userId", verifyToken, async (req, res) => {
  try {
    const user = await UserSocial3.findById(req.params.userId);

    if (!user) {
      return res.status(500).json({ msg: "No such user, wrong id!" });
    }

    const { password, ...others } = user._doc;

    return res.status(200).json(others);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});
//get all
userRoute.get("/findAll", async (req, res) => {
  try {
    const users = await UserSocial3.find({});

    const formattedUsers = users.map((user) => {
      return {
        username: user.username,
        email: user.email,
        _id: user._id,
        createdAt: user.createdAt,
      };
    });

    return res.status(200).json(formattedUsers);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});
//update
userRoute.put("/updateUser/:userId", verifyToken, async (req, res) => {
  if (req.params.userId.toString() === req.user.id.toString()) {
    try {
      if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, 10);
      }

      const updatedUser = await UserSocial3.findByIdAndUpdate(
        req.params.userId,
        { $set: req.body },
        { new: true }
      );
      return res.status(200).json(updatedUser);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  } else {
    return res.status(404).json({ msg: "USER NOT FIND!" });
  }
});

//delete
userRoute.delete("/deleteUser/:userId", verifyToken, async (req, res) => {
  if (req.params.userId === req.user.id) {
    try {
      await UserSocial3.findByIdAndDelete(req.user.id);
      return res.status(200).json({ msg: "Successfully deleted user" });
    } catch (error) {
      return res.status(500).json(error.message);
    }
  } else {
    return res
      .status(403)
      .json({ msg: "You can delete only your own profile!" });
  }
});

//follow/unfollow
userRoute.put("/toggleFollow/:otherUserId", verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.otherUserId;

    if (currentUserId === otherUserId) {
      throw new Error("You can't follow yourself");
    }

    const currentUser = await UserSocial3.findById(currentUserId);
    const otherUser = await UserSocial3.findById(otherUserId);

    if (!currentUser.followings.includes(otherUserId)) {
      currentUser.followings.push(otherUserId);
      otherUser.followers.push(currentUserId);

      await UserSocial3.findByIdAndUpdate(
        currentUserId,
        { $set: currentUser },
        { new: true }
      );
      await UserSocial3.findByIdAndUpdate(
        otherUserId,
        { $set: otherUser },
        { new: true }
      );

      return res
        .status(200)
        .json({ msg: "You have successfully followed the user!" });
    } else {
      currentUser.followings = currentUser.followings.filter(
        (id) => id !== otherUserId
      );
      otherUser.followers = otherUser.followers.filter(
        (id) => id !== currentUserId
      );

      await UserSocial3.findByIdAndUpdate(
        currentUserId,
        { $set: currentUser },
        { new: true }
      );
      await UserSocial3.findByIdAndUpdate(
        otherUserId,
        { $set: otherUser },
        { new: true }
      );

      return res
        .status(200)
        .json({ msg: "You have successfully unfollowed the user!" });
    }
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

//bookmark

//original
// userRoute.put("/bookmark/:postId", verifyToken, async (req, res) => {
//   try {
//     const post = await PostSocial3.findById(req.params.postId).populate(
//       "user",
//       "-password"
//     );
//     if (!post) {
//       return res.status(404).json({ msg: "No such post found" });
//     } else {
//       if (
//         post.user.bookmarkedPosts.some((post) => post._id === req.params.postId)
//       ) {
//         await UserSocial3.findByIdAndUpdate(req.user.id, {
//           $pull: { bookmarkedPosts: post },
//         });
//         return res
//           .status(200)
//           .json({ msg: "Successfully unbookmarked the post" });
//       } else {
//         console.log(post);
//         await UserSocial3.findByIdAndUpdate(req.user.id, {
//           $addToSet: { bookmarkedPosts: post },
//         });
//         return res
//           .status(200)
//           .json({ msg: "Successfully boomkarked the post" });
//       }
//     }
//   } catch (error) {
//     return res.status(500).json(error.message);
//   }
// });

userRoute.put("/bookmark/:postId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    // Checking if the post exists
    const post = await PostSocial3.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: "No such post found" });
    }

    // Fetching the user
    const user = await UserSocial3.findById(userId);

    // Checking if the post is already bookmarked
    const isBookmarked = user.bookmarkedPosts.some(
      (bookmark) => bookmark._id.toString() === postId
    );

    //const isBookmarked = user.bookmarkedPosts.includes(postId);

    if (isBookmarked) {
      // removing the bookmark
      await UserSocial3.findByIdAndUpdate(userId, {
        $pull: { bookmarkedPosts: { _id: post._id } },

        //$pull: { bookmarkedPosts: postId },
      });
      return res
        .status(200)
        .json({ msg: "Successfully unbookmarked the post" });
    } else {
      // adding the bookmark
      await UserSocial3.findByIdAndUpdate(userId, {
        $addToSet: { bookmarkedPosts: post },

        // $addToSet: { bookmarkedPosts: postId },
      });
      return res.status(200).json({ msg: "Successfully bookmarked the post" });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

// Fetching bookmarked posts for a user
userRoute.get("/bookmarkedPosts", verifyToken, async (req, res) => {
  try {
    const user = await UserSocial3.findById(req.user.id).populate({
      path: "bookmarkedPosts",
      populate: { path: "user", select: "username profileImg" },
    });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.status(200).json(user.bookmarkedPosts);
  } catch (error) {
    res.status(500).json(error.message);
  }
});

//
// userRoute.get("/bookmarks", verifyToken, async (req, res) => {
//   try {
//     const currentUser = await UserSocial3.findById(req.user.id).populate(
//       "bookmarkedPosts"
//     );
//     if (!currentUser) {
//       return res.status(404).json({ msg: "User not found!" });
//     }

//     return res.status(200).json(currentUser.bookmarkedPosts);
//   } catch (error) {
//     return res.status(500).json(error.message);
//   }
// });

module.exports = userRoute;
