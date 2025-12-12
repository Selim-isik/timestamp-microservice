const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");
const app = express();

require("dotenv").config();
app.use(cors({ optionsSuccessStatus: 200 }));
app.use(bodyParser.urlencoded({ extended: false }));

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully."))
  .catch((err) => console.error("MongoDB connection error:", err));

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true },
});
const Url = mongoose.model("Url", urlSchema);

app.get("/", (req, res) => {
  res.send("URL Shortener Microservice API is running.");
});

app.post("/api/shorturl", async (req, res) => {
  const originalUrl = req.body.url;

  const urlRegex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/gim;
  const domainMatch = urlRegex.exec(originalUrl);

  if (!domainMatch) {
    return res.json({ error: "invalid url" });
  }

  const hostname = domainMatch[1];

  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    try {
      let urlEntry = await Url.findOne({ original_url: originalUrl });

      if (urlEntry) {
        res.json({
          original_url: urlEntry.original_url,
          short_url: urlEntry.short_url,
        });
      } else {
        const count = await Url.countDocuments({});
        const newShortUrl = count + 1;

        urlEntry = new Url({
          original_url: originalUrl,
          short_url: newShortUrl,
        });

        await urlEntry.save();

        res.json({
          original_url: urlEntry.original_url,
          short_url: urlEntry.short_url,
        });
      }
    } catch (error) {
      res.status(500).json("Server error");
    }
  });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  try {
    const urlEntry = await Url.findOne({ short_url: shortUrl });

    if (urlEntry) {
      res.redirect(urlEntry.original_url);
    } else {
      res.json({ error: "No short URL found for the given input" });
    }
  } catch (error) {
    res.status(500).json("Server error");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Sunucu şurada çalışıyor: http://localhost:" + port);
});
