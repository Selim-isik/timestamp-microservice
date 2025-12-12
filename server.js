const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors({ optionsSuccessStatus: 200 }));

app.get("/", (req, res) => {
  res.send(
    "Request Header Parser Microservice API is running. Test endpoint: /api/whoami"
  );
});

app.get("/api/whoami", (req, res) => {
  const forwardedIps = req.header("x-forwarded-for");
  const clientIp = forwardedIps ? forwardedIps.split(",")[0] : req.ip;

  const language = req.headers["accept-language"];

  const software = req.headers["user-agent"];

  res.json({
    ipaddress: clientIp,
    language: language,
    software: software,
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Sunucu şurada çalışıyor: http://localhost:" + port);
});
