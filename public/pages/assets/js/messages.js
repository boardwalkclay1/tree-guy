// MESSAGES JS – Real Tree Guy OS

const API = {
  token: localStorage.getItem("rtgToken") || null,

  headers() {
    return this.token
      ? { "Authorization": `Bearer ${this.token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  },

  async get(path) {
    const res = await fetch(path, { headers: this.headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  },

  async post(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }
};

// THREAD LIST (messages.html)
export async function loadThreads() {
  const listEl = document.getElementById("threadList");
  if (!listEl) return;

  listEl.innerHTML = `<p>Loading…</p>`;

  try {
    // You can implement this in Worker as: GET /api/messages/threads
    const threads = await API.get("/api/messages/threads");

    if (!threads || !threads.length) {
      listEl.innerHTML = `<p>No conversations yet.</p>`;
      return;
    }

    listEl.innerHTML = "";

    threads.forEach(t => {
      const row = document.createElement("a");
      row.className = "thread-item";
      row.href = `/pages/job-thread.html?job=${encodeURIComponent(t.job_id)}`;

      const title = document.createElement("div");
      title.className = "thread-title";
      title.textContent = t.job_title || "Job Thread";

      const meta = document.createElement("div");
      meta.className = "thread-meta";
      meta.textContent = t.other_party || "";

      row.appendChild(title);
      row.appendChild(meta);
      listEl.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p>Error loading messages.</p>`;
  }
}

// JOB THREAD (job-thread.html)
export async function loadJobThread(jobId) {
  const listEl = document.getElementById("messageList");
  const titleEl = document.getElementById("jobTitle");
  if (!listEl) return;

  listEl.innerHTML = `<p>Loading…</p>`;

  try:
    // Worker: GET /api/messages/:job_id
    const messages = await API.get(`/api/messages/${encodeURIComponent(jobId)}`);

    listEl.innerHTML = "";

    if (titleEl && messages && messages.length && messages[0].job_title) {
      titleEl.textContent = messages[0].job_title;
    }

    if (!messages || !messages.length) {
      listEl.innerHTML = `<p>No messages yet.</p>`;
      return;
    }

    messages.forEach(m => {
      const row = document.createElement("div");
      row.className = `message-item message-item--${m.is_me ? "me" : "them"}`;

      const body = document.createElement("div");
      body.className = "message-body";
      body.textContent = m.body;

      const meta = document.createElement("div");
      meta.className = "message-meta";
      meta.textContent = new Date(m.created_at).toLocaleString();

      row.appendChild(body);
      row.appendChild(meta);
      listEl.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p>Error loading thread.</p>`;
  }
}

// SEND MESSAGE (job-thread.html)
export async function sendMessage(jobId, text) {
  try {
    await API.post("/api/messages", {
      job_id: jobId,
      body: text
      // Worker can infer to_user_id based on job + current user
    });

    // Reload thread after sending
    await loadJobThread(jobId);
  } catch (err) {
    console.error(err);
    alert("Could not send message.");
  }
}
