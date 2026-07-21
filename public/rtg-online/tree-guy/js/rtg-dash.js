const API_BASE = "/api/rtg-online/tree-guy";
const DASH_API = `${API_BASE}/dashboard`;
const PROFILE_API = `${API_BASE}/profile`;
const POST_API = `${API_BASE}/post`;
const LIKE_API = `${API_BASE}/like`;
const COMMENT_API = `${API_BASE}/comment`;
const SKILL_API = `${API_BASE}/skill`;
const EQUIPMENT_API = `${API_BASE}/equipment`;

async function apiGet(path) {
  const treeGuyId = localStorage.getItem("rtg_user_id");
  const res = await fetch(`${path}?id=${treeGuyId}`);
  return res.json();
}

async function apiPost(path, body) {
  const treeGuyId = localStorage.getItem("rtg_user_id");
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, id: treeGuyId })
  });
  return res.json();
}

async function loadDashboard() {
  const data = await apiGet(DASH_API);

  renderProfile(data.user, data.skills, data.equipment);
  renderMap(data.customers, data.jobPosts);
  renderSocialFeed(data.posts);
  renderMessages(data.messages);
  renderFriends(data.friends);
}

function renderProfile(user, skills, equipment) {
  document.getElementById("tgName").textContent = user.name;
  document.getElementById("tgAvatar").src =
    user.avatar_url || "/assets/default-avatar.png";
  document.getElementById("tgHeaderMsg").textContent = user.bio || "";
  document.getElementById("tgRole").textContent = user.tree_role || "";
  document.getElementById("tgLocation").textContent =
    `${user.city || ""}, ${user.state || ""}`;

  // Prefill profile form
  document.getElementById("tgProfileName").value = user.name || "";
  document.getElementById("tgProfileRole").value = user.tree_role || "";
  document.getElementById("tgProfileCity").value = user.city || "";
  document.getElementById("tgProfileState").value = user.state || "";
  document.getElementById("tgProfileAvatar").value = user.avatar_url || "";
  document.getElementById("tgProfileBio").value = user.bio || "";

  // Skills
  const skillsEl = document.getElementById("tgSkills");
  skillsEl.innerHTML = skills
    .map(s => `<li>${s.name} — ${s.level}</li>`)
    .join("");

  // Equipment
  const equipEl = document.getElementById("tgEquipment");
  equipEl.innerHTML = equipment
    .map(e => `<li>${e.name} (${e.years} yrs)</li>`)
    .join("");
}

function renderMap(customers, jobPosts) {
  const el = document.getElementById("tgMapList");
  el.innerHTML = "";

  [...customers, ...jobPosts].forEach(c => {
    el.innerHTML += `<div class="map-item">
      ${c.name || c.title} — ${c.address || ""} 
    </div>`;
  });
}

function renderSocialFeed(posts) {
  const el = document.getElementById("tgFeed");
  el.innerHTML = posts
    .map(
      p => `<div class="feed-item" data-post-id="${p.id}">
        <div class="feed-header">${p.user_name}</div>
        <div class="feed-content">${p.content}</div>
        ${p.media_url ? `<div class="feed-media"><img src="${p.media_url}"></div>` : ""}
        <div class="feed-actions">
          <button class="like-btn">Like (${p.like_count || 0})</button>
        </div>
        <div class="feed-comments">
          ${(p.comments || [])
            .map(c => `<div class="comment"><strong>${c.user_name}</strong>: ${c.text}</div>`)
            .join("")}
          <form class="comment-form">
            <input type="text" name="comment" placeholder="Add a comment...">
            <button type="submit">Send</button>
          </form>
        </div>
      </div>`
    )
    .join("");

  // Attach like + comment handlers
  el.querySelectorAll(".like-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const postEl = e.target.closest(".feed-item");
      const postId = postEl.dataset.postId;
      await apiPost(LIKE_API, { post_id: postId });
      loadDashboard();
    });
  });

  el.querySelectorAll(".comment-form").forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const postEl = e.target.closest(".feed-item");
      const postId = postEl.dataset.postId;
      const text = e.target.comment.value.trim();
      if (!text) return;
      await apiPost(COMMENT_API, { post_id: postId, text });
      e.target.comment.value = "";
      loadDashboard();
    });
  });
}

function renderMessages(messages) {
  const el = document.getElementById("tgMessages");
  el.innerHTML = messages
    .map(
      m => `<div class="msg-item">
        <strong>${m.from_name}</strong>: ${m.text}
      </div>`
    )
    .join("");
}

function renderFriends(friends) {
  const el = document.getElementById("tgFriends");
  el.innerHTML = friends
    .map(f => `<div class="friend-item">${f.friend_name}</div>`)
    .join("");
}

// Profile form
document.getElementById("tgProfileForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById("tgProfileName").value.trim(),
    tree_role: document.getElementById("tgProfileRole").value.trim(),
    city: document.getElementById("tgProfileCity").value.trim(),
    state: document.getElementById("tgProfileState").value.trim(),
    avatar_url: document.getElementById("tgProfileAvatar").value.trim(),
    bio: document.getElementById("tgProfileBio").value.trim()
  };
  await apiPost(PROFILE_API, body);
  loadDashboard();
});

// Post form
document.getElementById("tgPostForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    content: document.getElementById("tgPostContent").value.trim(),
    media_url: document.getElementById("tgPostMediaUrl").value.trim(),
    type: document.getElementById("tgPostType").value
  };
  if (!body.content) return;
  await apiPost(POST_API, body);
  document.getElementById("tgPostContent").value = "";
  document.getElementById("tgPostMediaUrl").value = "";
  loadDashboard();
});

// Skill form
document.getElementById("tgSkillForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById("tgSkillName").value.trim(),
    level: document.getElementById("tgSkillLevel").value.trim()
  };
  if (!body.name || !body.level) return;
  await apiPost(SKILL_API, body);
  document.getElementById("tgSkillName").value = "";
  document.getElementById("tgSkillLevel").value = "";
  loadDashboard();
});

// Equipment form
document.getElementById("tgEquipmentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById("tgEquipmentName").value.trim(),
    years: parseInt(document.getElementById("tgEquipmentYears").value, 10) || 0
  };
  if (!body.name) return;
  await apiPost(EQUIPMENT_API, body);
  document.getElementById("tgEquipmentName").value = "";
  document.getElementById("tgEquipmentYears").value = "";
  loadDashboard();
});

loadDashboard();
