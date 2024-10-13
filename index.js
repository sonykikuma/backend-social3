require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders:
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",

  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
const { initializeDatabase } = require("./db");

// const bcrypt = require("bcryptjs");
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const postRoute = require("./routes/postRoute");
const commentRoute = require("./routes/commentRoute");

app.use(express.json());
initializeDatabase();

app.use(express.urlencoded({ extended: true }));
app.use("/auth", authRoute);
app.use("/user", userRoute);
app.use("/post", postRoute);
app.use("/comment", commentRoute);

app.get("/", (req, res) => {
  res.send("Hello, Express");
});

const PORT = 3000;
app.listen(PORT, (req, res) => {
  console.log(`Server is running in port ${PORT}`);
});
module.exports = app;
