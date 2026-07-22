// rtg-dash.js
// FULL SOCIAL + CLIENT + PROFILE + SKILLS + EQUIPMENT WIRING

const API_BASE = "/api/rtg-online/tree-guy";
const treeGuyId = new URLSearchParams(window.location.search).get("id");

// ---------- UTIL ----------
const $ = sel => document.querySelector(sel);
const create = (tag, cls) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  return el;
};

async function apiGet(path) {
  const res = await fetch(`${API_BASE}/${path}?id=${encodeURIComponent(treeGuyId)}`);
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`POST ${path} failed`);
  return res.json();
}

// ---------- DASHBOARD LOAD ----------
async function loadDashboard() {
  const data = await apiGet("dashboard");

  // PROFILE
  if (data.user) {
    $("#tgAvatar").src = data.user.avatar_url || "/assets/img/logos/rtg-online-logo.jpg";
    $("#tgName").textContent = data.user.name || "Tree Guy";
    $("#tgHeaderMsg").textContent = data.user.bio || "";
    $("#tgRole").textContent = data.user.tree_role || "";
    $("#tgLocation").textContent = `${data.user.city || ""}, ${data.user.state || ""}`.trim();
    // preload profile form
    $("#tgProfileName").value = data.user.name || "";
    $("#tgProfileRole").value = data.user.tree_role || "";
    $("#tgProfileCity").value = data.user.city || "";
    $("#tgProfileState").value = data.user.state || "";
    $("#tgProfileAvatar").value = data.user.avatar_url || "";
    $("#tgProfileBio").value = data.user.bio || "";
  }

  // CLIENTS + MAP
  renderMapList(data.customers || []);

  // FEED
  renderFeed(data.posts || []);

  // MESSAGES
  renderMessages(data.messages || []);

  // FRIENDS
  renderFriends(data.friends || []);

  // SKILLS
  renderSkills(data.skills || []);

  // EQUIPMENT
  renderEquipment(data.equipment || []);
}

// ---------- MAP + CLIENTS ----------
function renderMapList(customers) {
  const container = $("#tgMapList");
  container.innerHTML = "";
  customers.forEach(c => {
    const item = create("div", "map-item");
    item.innerHTML = `
      <div><strong>${c.name || "Client"}</strong></div>
      <div>${c.address || ""}</div>
      <div>${c.city || ""}, ${c.state || ""}</div>
    `;
    container.appendChild(item);
  });
}

// ---------- FEED ----------
function renderFeed(posts) {
  const feed = $("#tgFeed");
  feed.innerHTML = "";
  posts.forEach(p => {
    const item = create("div", "feed-item");

    const header = create("div", "feed-header");
    header.textContent = `${p.user_name || "Tree Guy"} • ${p.type || "post"}`;

    const content = create("div", "feed-content");
    content.textContent = p.content || "";

    item.appendChild(header);
    item.appendChild(content);

    if (p.media_url) {
      const media = create("div", "feed-media");
      const img = create("img");
      img.src = p.media_url;
      media.appendChild(img);
      item.appendChild(media);
    }

    const actions = create("div", "feed-actions");
    const likeBtn = create("button", "like-btn");
    likeBtn.textContent = `Like (${p.like_count || 0})`;
    likeBtn.addEventListener("click", () => likePost(p.id));
    actions.appendChild(likeBtn);
    item.appendChild(actions);

    const commentsWrap = create("div", "feed-comments");
    (p.comments || []).forEach(c => {
      const cEl = create("div", "comment");
      cEl.textContent = `${c.user_name || "User"}: ${c.text}`;
      commentsWrap.appendChild(cEl);
    });

    const form = create("form", "comment-form");
    const input = create("input");
    input.placeholder = "Add a comment...";
    const btn = create("button");
    btn.type = "submit";
    btn.textContent = "Comment";
    form.appendChild(input);
    form.appendChild(btn);

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      await commentPost(p.id, text);
      await reloadFeedOnly();
    });

    commentsWrap.appendChild(form);
    item.appendChild(commentsWrap);

    feed.appendChild(item);
  });
}

async function reloadFeedOnly() {
  const data = await apiGet("dashboard");
  renderFeed(data.posts || []);
}

async function likePost(postId) {
  await apiPost("like", { id: treeGuyId, post_id: postId });
  await reloadFeedOnly();
}

async function commentPost(postId, text) {
  await apiPost("comment", { id: treeGuyId, post_id: postId, text });
}

// ---------- MESSAGES ----------
function renderMessages(messages) {
  const container = $("#tgMessages");
  container.innerHTML = "";
  messages.forEach(m => {
    const item = create("div", "msg-item");
    item.innerHTML = `
      <div><strong>${m.from_name || "Unknown"}</strong></div>
      <div>${m.text || ""}</div>
    `;
    container.appendChild(item);
  });
}

// ---------- FRIENDS ----------
function renderFriends(friends) {
  const container = $("#tgFriends");
  container.innerHTML = "";
  friends.forEach(f => {
    const item = create("div", "friend-item");
    item.textContent = f.friend_name || "Friend";
    container.appendChild(item);
  });
}

// ---------- SKILLS ----------
function renderSkills(skills) {
  const list = $("#tgSkills");
  list.innerHTML = "";
  skills.forEach(s => {
    const li = create("li");
    li.textContent = `${s.name} — ${s.level}`;
    list.appendChild(li);
  });
}

// ---------- EQUIPMENT ----------
function renderEquipment(equipment) {
  const list = $("#tgEquipment");
  list.innerHTML = "";
  equipment.forEach(e => {
    const li = create("li");
    li.textContent = `${e.name} — ${e.years} years`;
    list.appendChild(li);
  });
}

// ---------- FORM HANDLERS ----------

// PROFILE UPDATE
$("#tgProfileForm").addEventListener("submit", async e => {
  e.preventDefault();
  const body = {
    id: treeGuyId,
    name: $("#tgProfileName").value.trim(),
    tree_role: $("#tgProfileRole").value.trim(),
    city: $("#tgProfileCity").value.trim(),
    state: $("#tgProfileState").value.trim(),
    avatar_url: $("#tgProfileAvatar").value.trim(),
    bio: $("#tgProfileBio").value.trim()
  };
  await apiPost("profile", body);
  await loadDashboard();
});

// CREATE POST
$("#tgPostForm").addEventListener("submit", async e => {
  e.preventDefault();
  const content = $("#tgPostContent").value.trim();
  if (!content) return;
  const body = {
    id: treeGuyId,
    content,
    media_url: $("#tgPostMediaUrl").value.trim(),
    type: $("#tgPostType").value
  };
  await apiPost("post", body);
  $("#tgPostContent").value = "";
  $("#tgPostMediaUrl").value = "";
  await reloadFeedOnly();
});

// ADD SKILL
$("#tgSkillForm").addEventListener("submit", async e => {
  e.preventDefault();
  const body = {
    id: treeGuyId,
    name: $("#tgSkillName").value.trim(),
    level: $("#tgSkillLevel").value.trim()
  };
  if (!body.name || !body.level) return;
  await apiPost("skill", body);
  const data = await apiGet("dashboard");
  renderSkills(data.skills || []);
  $("#tgSkillName").value = "";
  $("#tgSkillLevel").value = "";
});

// ADD EQUIPMENT
$("#tgEquipmentForm").addEventListener("submit", async e => {
  e.preventDefault();
  const body = {
    id: treeGuyId,
    name: $("#tgEquipmentName").value.trim(),
    years: Number($("#tgEquipmentYears").value || 0)
  };
  if (!body.name) return;
  await apiPost("equipment", body);
  const data = await apiGet("dashboard");
  renderEquipment(data.equipment || []);
  $("#tgEquipmentName").value = "";
  $("#tgEquipmentYears").value = "";
});

// ---------- INIT ----------
(async () => {
  if (!treeGuyId) {
    console.error("Missing ?id= in URL for tree guy dashboard.");
    return;
  }
  try {
    await loadDashboard();
  } catch (err) {
    console.error("Dashboard load failed:", err);
  }
})();
