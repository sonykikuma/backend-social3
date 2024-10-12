const authRoute = require("express").Router();
const UserSocial3 = require("../models/UserSocial3");
const bcrypt = require("bcrypt"); //encode password for security reasons
const jwt = require("jsonwebtoken");

authRoute.post("/register", async (req, res) => {
  try {
    const isExisting = await UserSocial3.findOne({ email: req.body.email });
    if (isExisting) {
      throw new Error("already such an email registered.");
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = await UserSocial3.create({
      ...req.body,
      password: hashedPassword,
    });

    const { password, ...others } = newUser._doc; // ._doc are actual values
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });

    return res.status(201).json({ others, token });
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

authRoute.post("/login", async (req, res) => {
  try {
    const user = await UserSocial3.findOne({ email: req.body.email });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const comparePass = await bcrypt.compare(req.body.password, user.password);
    if (!comparePass) {
      throw new Error("Invalid credentials");
    }

    const { password, ...others } = user._doc;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });

    return res.status(200).json({ others, token });
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

module.exports = authRoute;
