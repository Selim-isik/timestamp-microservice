const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  try {
    const newUser = new User({ username: req.body.username });
    const savedUser = await newUser.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: "Username already taken" });
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({}, "username _id");
  res.json(users);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { description, duration, date } = req.body;
  let dateObj = date ? new Date(date) : new Date();
  if (dateObj.toString() === "Invalid Date")
    return res.json({ error: "Invalid Date" });
  const user = await User.findById(req.params._id);
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
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;
  const user = await User.findById(req.params._id);
  if (!user) return res.json({ error: "User not found" });
  let log = user.log;
  if (from) log = log.filter((e) => e.date >= new Date(from));
  if (to) log = log.filter((e) => e.date <= new Date(to));
  if (limit) log = log.slice(0, parseInt(limit));
  const finalLog = log.map((e) => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString(),
  }));
  res.json({
    _id: user._id,
    username: user.username,
    count: finalLog.length,
    log: finalLog,
  });
});

const port = process.env.PORT || 3000;
app.listen(port);
