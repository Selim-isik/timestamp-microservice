import express from "express";
import cors from "cors";
import dns from "dns";
import { URL } from "url";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("URL Shortener Microservice is running");
});

let urls = [];
let counter = 1;

app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  try {
    const urlObj = new URL(originalUrl);

    dns.lookup(urlObj.hostname, (err) => {
      if (err) {
        return res.json({ error: "invalid url" });
      }

      let found = urls.find((u) => u.original_url === originalUrl);
      if (found) {
        return res.json(found);
      }

      const shortUrl = { original_url: originalUrl, short_url: counter++ };
      urls.push(shortUrl);
      res.json(shortUrl);
    });
  } catch (e) {
    return res.json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrlParam = parseInt(req.params.short_url);
  const entry = urls.find((u) => u.short_url === shortUrlParam);

  if (!entry) {
    return res.json({ error: "No URL found" });
  }

  res.redirect(entry.original_url);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
