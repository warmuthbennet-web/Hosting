const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Alle statischen Dateien (CSS/JS) aus demselben Ordner
app.use("/static", express.static(__dirname));

// Daten speichern
let sites = fs.existsSync("data.json") ? JSON.parse(fs.readFileSync("data.json")) : [];
let jobs = {};

function save() {
  fs.writeFileSync("data.json", JSON.stringify(sites, null, 2));
}

// Root-Route zeigt index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Alle Sites zurückgeben
app.get("/sites", (req, res) => res.json(sites));

// Neue Site hinzufügen
app.post("/add", (req, res) => {
  const { url, interval } = req.body;
  if (!url) return res.status(400).send("Fehlt URL");

  if (sites.find(s => s.url === url)) return res.status(400).send("URL existiert schon");

  const site = {
    url,
    interval: parseInt(interval) || 60000,
    status: "unknown"
  };

  sites.push(site);
  save();
  startPing(site);

  res.send("Gespeichert!");
});

// Site löschen
app.post("/delete", (req, res) => {
  const { url } = req.body;
  sites = sites.filter(s => s.url !== url);
  if (jobs[url]) clearInterval(jobs[url]);
  save();
  res.send("Gelöscht");
});

// Ping-Funktion echte Websites
function startPing(site) {
  if (jobs[site.url]) clearInterval(jobs[site.url]);
  jobs[site.url] = setInterval(async () => {
    try {
      const response = await fetch(site.url, { method: "GET", timeout: 10000 });
      site.status = response.ok ? "online" : "offline";
    } catch {
      site.status = "offline";
    }
  }, site.interval || 60000);
}

// Alle Sites beim Start pingen
sites.forEach(startPing);

// Ping-Endpunkt für UptimeRobot
app.get("/ping", (req, res) => res.send("OK"));

// Server starten
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
