const list = document.getElementById("list");

async function load() {
  const res = await fetch("/sites");
  const sites = await res.json();

  list.innerHTML = "";

  sites.forEach(site => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <p>${site.url}</p>
      <span class="${site.status}">● ${site.status}</span>
      <button onclick="remove('${site.url}')">Löschen</button>
    `;

    list.appendChild(div);
  });
}

async function add() {
  const url = document.getElementById("url").value;
  const interval = document.getElementById("interval").value;

  if (!url) return alert("Bitte URL eingeben");

  await fetch("/add", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ url, interval })
  });

  document.getElementById("url").value = "";
  document.getElementById("interval").value = "";

  load();
}

async function remove(url) {
  await fetch("/delete", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ url })
  });

  load();
}

// Alle 5 Sekunden Status aktualisieren
setInterval(load, 5000);
load();
