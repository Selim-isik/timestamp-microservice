const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));

app.get("/", (req, res) => {
  res.send("Timestamp Microservice API is running");
});

app.get("/api/", (req, res) => {
  const date = new Date();
  res.json({
    unix: date.getTime(),
    utc: date.toUTCString(),
  });
});

app.get("/api/:date", (req, res) => {
  let dateString = req.params.date;
  let date;

  if (/^\d{5,}$/.test(dateString)) {
    date = new Date(parseInt(dateString));
  } else {
    date = new Date(dateString);
  }

  if (date.toString() === "Invalid Date") {
    res.json({ error: "Invalid Date" });
  } else {
    res.json({
      unix: date.getTime(),
      utc: date.toUTCString(),
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Sunucu şurada çalışıyor: http://localhost:" + port);
});
