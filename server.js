const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

let jobs = {};
let sites = fs.existsSync("data.json") ? JSON.parse(fs.readFileSync("data.json")) : [];

// 💾 Speichern
function save() {
  fs.writeFileSync("data.json", JSON.stringify(sites, null, 2));
}

// Alle Seiten zurückgeben
app.get("/sites", (req, res) => res.json(sites));

// Neue Seite hinzufügen
app.post("/add", (req, res) => {
  const { url, interval } = req.body;
  if (!url) return res.send("Fehlt URL");

  if (sites.find(s => s.url === url)) return res.send("URL existiert schon");

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

// Seite löschen
app.post("/delete", (req, res) => {
  const { url } = req.body;

  sites = sites.filter(s => s.url !== url);
  if (jobs[url]) clearInterval(jobs[url]);

  save();
  res.send("Gelöscht");
});

// Funktion um echte Website zu pingen
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

// Beim Start alle Sites pingen
sites.forEach(startPing);

// Ping Endpoint für externe Dienste
app.get("/ping", (req, res) => res.send("OK"));

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
