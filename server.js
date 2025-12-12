const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGO_URI);

const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  log: [exerciseSchema],
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.send("Exercise Tracker API is running");
});

app.post("/api/users", async (req, res) => {
  const { username } = req.body;
  try {
    const newUser = new User({ username });
    const savedUser = await newUser.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    if (err.code === 11000) return res.json({ username, _id: "taken" });
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "username _id");
    res.json(users);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;
  const dateObj = date ? new Date(date) : new Date();
  if (dateObj.toString() === "Invalid Date")
    return res.json({ error: "Invalid Date format" });
  try {
    const user = await User.findById(userId);
    if (!user) return res.json({ error: "User not found" });
    const newExercise = {
      description,
      duration: parseInt(duration),
      date: dateObj,
    };
    user.log.push(newExercise);
    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      date: dateObj.toDateString(),
      duration: newExercise.duration,
      description: newExercise.description,
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;
  try {
    const user = await User.findById(userId);
    if (!user) return res.json({ error: "User not found" });
    let filteredLog = user.log;
    if (from)
      filteredLog = filteredLog.filter((ex) => ex.date >= new Date(from));
    if (to) filteredLog = filteredLog.filter((ex) => ex.date <= new Date(to));
    if (limit) filteredLog = filteredLog.slice(0, parseInt(limit));
    const finalLog = filteredLog.map((ex) => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString(),
    }));
    res.json({
      username: user.username,
      count: finalLog.length,
      _id: user._id,
      log: finalLog,
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port " + port));
