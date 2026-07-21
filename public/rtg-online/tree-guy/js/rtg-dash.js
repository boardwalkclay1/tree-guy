const API = "https://api.realtreeguy.com/api/pro/dashboard";

async function loadDashboard() {
  const treeGuyId = localStorage.getItem("rtg_user_id");

  const res = await fetch(`${API}?id=${treeGuyId}`);
  const data = await res.json();

  renderProfile(data.user);
  renderCustomers(data.customers);
  renderJobs(data.jobs);
  renderEvents(data.events);
  renderMap(data.savedLocations);
  renderNearby(data.nearbyPosts);
  renderSocial(data.socialFeed);
}

function renderProfile(u) {
  document.getElementById("tgName").textContent = u.name;
  document.getElementById("tgAvatar").src = u.avatar_url || "/assets/default-avatar.png";
  document.getElementById("tgAddress").textContent = `${u.address}, ${u.city}, ${u.state}`;
  document.getElementById("tgBio").textContent = u.bio || "No bio yet.";
}

function renderCustomers(list) {
  const el = document.getElementById("customersList");
  el.innerHTML = "";
  list.forEach(c => {
    el.innerHTML += `<div class="cust-item">${c.name} — ${c.phone}</div>`;
  });
}

function renderJobs(list) {
  const el = document.getElementById("jobsList");
  el.innerHTML = "";
  list.forEach(j => {
    el.innerHTML += `<div class="job-item">${j.title}</div>`;
  });
}

function renderEvents(list) {
  const el = document.getElementById("eventsList");
  el.innerHTML = "";
  list.forEach(e => {
    el.innerHTML += `<div class="event-item">${e.title} — ${e.date}</div>`;
  });
}

function renderMap(list) {
  const el = document.getElementById("mapList");
  el.innerHTML = "";
  list.forEach(m => {
    el.innerHTML += `<div class="map-item">${m.label}</div>`;
  });
}

function renderNearby(list) {
  const el = document.getElementById("nearbyList");
  el.innerHTML = "";
  list.forEach(n => {
    el.innerHTML += `<div class="nearby-item">${n.title} — $${n.budget}</div>`;
  });
}

function renderSocial(list) {
  const el = document.getElementById("socialFeed");
  el.innerHTML = "";
  list.forEach(p => {
    el.innerHTML += `<div class="post-item">${p.content}</div>`;
  });
}

loadDashboard();
