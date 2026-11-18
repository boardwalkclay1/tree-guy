const $ = id => document.getElementById(id);
let user = null;
let leads = [];
let currentThread = null;
let editingContact = null;

async function api(path, method = "GET", data) {
  const options = { method, headers: { Accept: "application/json" } };
  if (data !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }
  const response = await fetch(`/api/portal${path}`, options);
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || "Request failed");
    error.status = response.status;
    throw error;
  }
  return result;
}

function status(message) { $("status").textContent = message; }
function report(error) { console.error(error); status(error.message || "Request failed"); }
function fields(form) { return Object.fromEntries(new FormData(form)); }

function entry(title, details) {
  const element = document.createElement("article");
  element.className = "entry";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const body = document.createElement("p");
  body.textContent = details;
  element.append(heading, body);
  return element;
}

function button(text, action) {
  const element = document.createElement("button");
  element.textContent = text;
  element.addEventListener("click", async () => {
    element.disabled = true;
    status("");
    try { await action(); } catch (error) { report(error); } finally { element.disabled = false; }
  });
  return element;
}

function selectSection(name) {
  for (const section of document.querySelectorAll(".panel")) section.hidden = section.id !== name;
}

function renderLeads() {
  const container = $("leadsList");
  container.replaceChildren();
  if (!leads.length) container.textContent = "No matching requests.";
  for (const lead of leads) {
    const item = entry(lead.title, `${lead.city}, ${lead.state}\n${lead.description}`);
    if (user.role === "tree") {
      item.append(button("Message customer", async () => {
        const { thread } = await api("/threads", "POST", { lead_id: lead.id });
        selectSection("messages");
        await loadThreads();
        await openThread(thread.id);
      }));
    }
    container.append(item);
  }
}

async function loadLeads() {
  const query = user.role === "tree" ? `?q=${encodeURIComponent($("leadSearch").value.trim())}` : "";
  ({ leads } = await api(`/leads${query}`));
  renderLeads();
}

async function loadContacts() {
  const { contacts } = await api("/contacts");
  const container = $("contactsList");
  container.replaceChildren();
  if (!contacts.length) container.textContent = "No contacts saved yet.";
  for (const contact of contacts) {
    const item = entry(contact.name, [contact.phone, contact.email, contact.address, contact.notes].filter(Boolean).join("\n"));
    item.append(button("Edit contact", async () => {
      editingContact = contact.id;
      for (const field of ["name", "phone", "email", "address", "notes"]) {
        $("contactForm").elements[field].value = contact[field];
      }
      $("saveContact").textContent = "Update contact";
      $("cancelEdit").hidden = false;
      $("contactForm").elements.name.focus();
    }));
    item.append(button("Delete contact", async () => {
      if (!confirm(`Delete ${contact.name}?`)) return;
      await api(`/contacts/${encodeURIComponent(contact.id)}`, "DELETE");
      await loadContacts();
    }));
    container.append(item);
  }
}

async function loadThreads() {
  const { threads } = await api("/threads");
  const container = $("threadsList");
  container.replaceChildren();
  if (!threads.length) container.textContent = "No conversations yet.";
  for (const thread of threads) {
    const item = entry(thread.title, thread.other_name);
    item.append(button("Open conversation", () => openThread(thread.id)));
    container.append(item);
  }
}

async function openThread(id) {
  const result = await api(`/threads/${encodeURIComponent(id)}/messages`);
  currentThread = id;
  $("conversation").hidden = false;
  $("conversationTitle").textContent = result.thread.title;
  $("messageList").replaceChildren();
  if (!result.messages.length) $("messageList").textContent = "No messages yet.";
  for (const message of result.messages) {
    $("messageList").append(entry(message.sender_name, message.body));
  }
}

async function signedIn(account) {
  user = account;
  $("auth").hidden = true;
  $("app").hidden = false;
  $("logout").hidden = false;
  $("greeting").textContent = `Welcome, ${user.name}`;
  $("contactsTab").hidden = user.role !== "tree";
  $("leadSearchForm").hidden = user.role !== "tree";
  $("leadForm").hidden = user.role !== "client";
  selectSection("leads");
  if (user.role === "tree") {
    $("app").hidden = true;
    status("Tree professional access requires a $30 monthly subscription. Square payments are not configured yet.");
    return;
  }
  status("Posting a service request costs $10. Square payments are not configured yet.");
  await loadLeads();
  if (user.role === "tree") await loadContacts();
  await loadThreads();
}

function bindForm(id, action) {
  const form = $(id);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"], button:not([type])');
    submit.disabled = true;
    status("");
    try { await action(form); } catch (error) { report(error); } finally { submit.disabled = false; }
  });
}

bindForm("loginForm", async form => {
  const result = await api("/login", "POST", fields(form));
  form.reset();
  await signedIn(result.user);
});
bindForm("registerForm", async form => {
  const result = await api("/register", "POST", fields(form));
  form.reset();
  await signedIn(result.user);
});
bindForm("leadForm", async form => {
  await api("/leads", "POST", fields(form));
  form.reset();
  await loadLeads();
  status("Request posted.");
});
bindForm("contactForm", async form => {
  if (editingContact) {
    await api(`/contacts/${encodeURIComponent(editingContact)}`, "PATCH", fields(form));
  } else {
    await api("/contacts", "POST", fields(form));
  }
  editingContact = null;
  form.reset();
  $("saveContact").textContent = "Save contact";
  $("cancelEdit").hidden = true;
  await loadContacts();
  status("Contact saved.");
});
bindForm("leadSearchForm", async () => { await loadLeads(); });
bindForm("messageForm", async form => {
  if (!currentThread) throw new Error("Open a conversation first.");
  await api(`/threads/${encodeURIComponent(currentThread)}/messages`, "POST", fields(form));
  form.reset();
  await openThread(currentThread);
  await loadThreads();
});
document.querySelectorAll("[data-section]").forEach(element => {
  element.addEventListener("click", () => selectSection(element.dataset.section));
});
$("cancelEdit").addEventListener("click", () => {
  editingContact = null;
  $("contactForm").reset();
  $("saveContact").textContent = "Save contact";
  $("cancelEdit").hidden = true;
});
$("refreshMessages").addEventListener("click", async () => {
  try {
    await loadThreads();
    if (currentThread) await openThread(currentThread);
    status("Conversations refreshed.");
  } catch (error) { report(error); }
});
$("logout").addEventListener("click", async () => {
  try {
    await api("/logout", "POST");
    user = null;
    currentThread = null;
    editingContact = null;
    $("contactForm").reset();
    $("saveContact").textContent = "Save contact";
    $("cancelEdit").hidden = true;
    $("leadSearch").value = "";
    $("conversation").hidden = true;
    $("app").hidden = true;
    $("logout").hidden = true;
    $("auth").hidden = false;
    status("Signed out.");
  } catch (error) { report(error); }
});

try {
  const result = await api("/me");
  await signedIn(result.user);
} catch (error) {
  if (!user) $("auth").hidden = false;
  if (error.status !== 401) report(error);
}
