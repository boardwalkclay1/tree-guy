// ============================================================
// RTG ONLINE – CLIENT DASHBOARD JS
// ============================================================

const API_BASE = "https://rtg-app.boardwalkclay1.workers.dev/api/rtg-online";

// Mock: current client (replace with real auth)
const CURRENT_CLIENT_ID = "CLIENT_DEMO_1";

/* ============================================================
   DOM ELEMENTS
============================================================ */
const clientNameDisplay = document.getElementById("clientNameDisplay");

const jobForm           = document.getElementById("jobForm");
const jobTitleInput     = document.getElementById("jobTitle");
const jobDescInput      = document.getElementById("jobDescription");
const jobBudgetInput    = document.getElementById("jobBudget");
const jobAddressInput   = document.getElementById("jobAddress");
const jobPhotosInput    = document.getElementById("jobPhotos");
const jobPayAndPostBtn  = document.getElementById("jobPayAndPostBtn");

const clientJobsList    = document.getElementById("clientJobsList");

const treeGuyProfileModal = document.getElementById("treeGuyProfileModal");
const treeGuyProfileBody  = document.getElementById("treeGuyProfileBody");
const closeTreeGuyProfile = document.getElementById("closeTreeGuyProfile");

const messageModal      = document.getElementById("messageModal");
const closeMessageModal = document.getElementById("closeMessageModal");
const messageThread     = document.getElementById("messageThread");
const messageInput      = document.getElementById("messageInput");
const sendMessageBtn    = document.getElementById("sendMessageBtn");

let activeJobId = null;
let activeTreeGuyId = null;

/* ============================================================
   API HELPERS
============================================================ */
async function apiGetClientProfile() {
  const res = await fetch(`${API_BASE}/client/profile?id=${CURRENT_CLIENT_ID}`);
  return await res.json();
}

async function apiGetClientJobs() {
  const res = await fetch(`${API_BASE}/client/jobs?id=${CURRENT_CLIENT_ID}`);
  return await res.json();
}

async function apiCreateJob(jobPayload) {
  const res = await fetch(`${API_BASE}/client/jobs/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jobPayload)
  });
  return await res.json();
}

async function apiGetTreeGuyProfile(treeGuyId) {
  const res = await fetch(`${API_BASE}/treeguy/profile?id=${treeGuyId}`);
  return await res.json();
}

async function apiGetMessages(jobId, treeGuyId) {
  const res = await fetch(`${API_BASE}/messages/thread?jobId=${jobId}&treeGuyId=${treeGuyId}&clientId=${CURRENT_CLIENT_ID}`);
  return await res.json();
}

async function apiSendMessage(jobId, treeGuyId, text) {
  const res = await fetch(`${API_BASE}/messages/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId,
      treeGuyId,
      clientId: CURRENT_CLIENT_ID,
      text
    })
  });
  return await res.json();
}

/* ============================================================
   INIT – LOAD CLIENT PROFILE + JOBS
============================================================ */
async function initClientDashboard() {
  try {
    const profile = await apiGetClientProfile();
    clientNameDisplay.textContent = profile.name || "Client";

    const jobs = await apiGetClientJobs();
    renderClientJobs(jobs);
  } catch (err) {
    console.error("Error loading client dashboard:", err);
  }
}

/* ============================================================
   RENDER JOBS
============================================================ */
function renderClientJobs(jobs) {
  clientJobsList.innerHTML = "";

  if (!jobs || jobs.length === 0) {
    clientJobsList.innerHTML = `<p class="jobs-empty">No jobs posted yet.</p>`;
    return;
  }

  for (const job of jobs) {
    const jobEl = document.createElement("div");
    jobEl.className = "job-card";

    jobEl.innerHTML = `
      <div class="job-main">
        <div class="job-title">${job.title}</div>
        <div class="job-desc">${job.description}</div>
        <div class="job-meta">
          <span>Budget: $${job.budget}</span>
          <span>Address: ${job.address}</span>
          <span>Status: ${job.status || "Listed"}</span>
        </div>
      </div>
      <div class="job-photos">
        ${(job.photos || []).map(p => `<img src="${p.url}" alt="Job photo">`).join("")}
      </div>
      <div class="job-matches">
        <h4>Matched Tree Guys</h4>
        <div class="job-matches-list">
          ${(job.matches || []).map(tg => `
            <div class="treeguy-card" data-treeguy-id="${tg.id}" data-job-id="${job.id}">
              <div class="treeguy-name">${tg.name}</div>
              <div class="treeguy-meta">
                <span>${tg.biz}</span>
                <span>Rating: ${tg.rating || "N/A"}</span>
              </div>
              <div class="treeguy-actions">
                <button class="rtg-btn rtg-btn--outline view-profile-btn">View Profile</button>
                <button class="rtg-btn rtg-btn--primary message-btn">Message</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    clientJobsList.appendChild(jobEl);
  }

  // Attach events for profile + messaging
  clientJobsList.querySelectorAll(".view-profile-btn").forEach(btn => {
    btn.addEventListener("click", onViewTreeGuyProfileClick);
  });

  clientJobsList.querySelectorAll(".message-btn").forEach(btn => {
    btn.addEventListener("click", onMessageTreeGuyClick);
  });
}

/* ============================================================
   JOB POSTING + PAYMENT FLOW
============================================================ */
jobPayAndPostBtn?.addEventListener("click", async () => {
  try {
    // 1. Collect job data
    const title = jobTitleInput.value.trim();
    const description = jobDescInput.value.trim();
    const budget = parseFloat(jobBudgetInput.value);
    const address = jobAddressInput.value.trim();

    if (!title || !description || !address || isNaN(budget)) {
      alert("Please fill out all job fields.");
      return;
    }

    // 2. Collect photos (Base64 or upload later)
    const photos = [];
    const files = jobPhotosInput.files;
    if (files && files.length > 0) {
      for (const file of files) {
        const dataUrl = await fileToDataURL(file);
        photos.push({ id: crypto.randomUUID(), url: dataUrl });
      }
    }

    // 3. Payment step (client pays $10)
    const confirmed = confirm("You will be charged $10 to list this job. Continue?");
    if (!confirmed) return;

    // Here you’d integrate Stripe/PayPal/etc.
    // For now, assume payment success:
    const paymentResult = { success: true, amount: 10 };

    if (!paymentResult.success) {
      alert("Payment failed. Please try again.");
      return;
    }

    // 4. Create job via API
    const jobPayload = {
      client_id: CURRENT_CLIENT_ID,
      title,
      description,
      budget,
      address,
      photos
    };

    const result = await apiCreateJob(jobPayload);

    if (result && result.success) {
      alert("Job listed successfully.");
      // Reload jobs
      const jobs = await apiGetClientJobs();
      renderClientJobs(jobs);

      // Reset form
      jobForm.reset();
      jobPhotosInput.value = "";
    } else {
      alert("Failed to list job.");
    }
  } catch (err) {
    console.error("Error posting job:", err);
    alert("Error posting job.");
  }
});

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   VIEW TREE GUY PROFILE
============================================================ */
async function onViewTreeGuyProfileClick(e) {
  const card = e.target.closest(".treeguy-card");
  if (!card) return;

  const treeGuyId = card.dataset.treeguyId;
  const jobId = card.dataset.jobId;

  activeTreeGuyId = treeGuyId;
  activeJobId = jobId;

  try {
    const profile = await apiGetTreeGuyProfile(treeGuyId);
    renderTreeGuyProfile(profile);
    openModal(treeGuyProfileModal);
  } catch (err) {
    console.error("Error loading tree guy profile:", err);
  }
}

function renderTreeGuyProfile(profile) {
  treeGuyProfileBody.innerHTML = `
    <div class="treeguy-profile">
      <div class="treeguy-header">
        <div class="treeguy-name">${profile.name || "Tree Guy"}</div>
        <div class="treeguy-biz">${profile.biz || ""}</div>
      </div>
      <div class="treeguy-contact">
        <div>Phone: ${profile.phone || "N/A"}</div>
        <div>Email: ${profile.email || "N/A"}</div>
        <div>Service Area: ${profile.service_area || "N/A"}</div>
      </div>
      <div class="treeguy-meta">
        <div>Specialties: ${(profile.specialties || []).join(", ")}</div>
        <div>Equipment: ${(profile.equipment || []).join(", ")}</div>
        <div>Rating: ${profile.rating || "N/A"}</div>
      </div>
      <div class="treeguy-portfolio">
        <h4>Portfolio</h4>
        <div class="treeguy-photos">
          ${(profile.photos || []).map(p => `<img src="${p.url}" alt="Work photo">`).join("")}
        </div>
      </div>
    </div>
  `;
}

closeTreeGuyProfile?.addEventListener("click", () => {
  closeModal(treeGuyProfileModal);
});

/* ============================================================
   MESSAGING
============================================================ */
async function onMessageTreeGuyClick(e) {
  const card = e.target.closest(".treeguy-card");
  if (!card) return;

  const treeGuyId = card.dataset.treeguyId;
  const jobId = card.dataset.jobId;

  activeTreeGuyId = treeGuyId;
  activeJobId = jobId;

  try {
    const thread = await apiGetMessages(jobId, treeGuyId);
    renderMessageThread(thread);
    openModal(messageModal);
  } catch (err) {
    console.error("Error loading messages:", err);
  }
}

function renderMessageThread(thread) {
  messageThread.innerHTML = "";

  if (!thread || thread.length === 0) {
    messageThread.innerHTML = `<p class="messages-empty">No messages yet.</p>`;
    return;
  }

  for (const msg of thread) {
    const msgEl = document.createElement("div");
    msgEl.className = `message-bubble message-bubble--${msg.sender}`;
    msgEl.textContent = msg.text;
    messageThread.appendChild(msgEl);
  }

  messageThread.scrollTop = messageThread.scrollHeight;
}

sendMessageBtn?.addEventListener("click", async () => {
  const text = messageInput.value.trim();
  if (!text || !activeJobId || !activeTreeGuyId) return;

  try {
    const result = await apiSendMessage(activeJobId, activeTreeGuyId, text);
    if (result && result.success) {
      const thread = await apiGetMessages(activeJobId, activeTreeGuyId);
      renderMessageThread(thread);
      messageInput.value = "";
    }
  } catch (err) {
    console.error("Error sending message:", err);
  }
});

/* ============================================================
   MODAL HELPERS
============================================================ */
function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

closeMessageModal?.addEventListener("click", () => {
  closeModal(messageModal);
});

/* ============================================================
   START
============================================================ */
initClientDashboard();
