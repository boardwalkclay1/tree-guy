// Basic mock job data – replace with real data wiring later
const jobData = {
  id: "JOB_123",
  title: "Oak Removal & Canopy Lift",
  status: "Scheduled", // Scheduled | In Progress | Complete
  client: "Pinecrest HOA",
  address: "1427 Pinecrest Lane, Atlanta, GA",
  date: "May 12, 2026",
  weather: "Partly cloudy · 68°F · Light wind",
  totalAmount: 2400,
  budgetLines: [
    {
      id: "line1",
      role: "Climber",
      person: "Mike",
      amount: 800,
      agreementStatus: "Signed" // Signed | Pending | None
    },
    {
      id: "line2",
      role: "Ground",
      person: "Jay",
      amount: 500,
      agreementStatus: "Pending"
    },
    {
      id: "line3",
      role: "Haul",
      person: "Truck Crew",
      amount: 400,
      agreementStatus: "Signed"
    },
    {
      id: "line4",
      role: "Equipment",
      person: "Bucket Rental",
      amount: 150,
      agreementStatus: "None"
    }
  ],
  tags: ["Large removal", "Backyard access", "Bucket", "HOA"],
  notes: "Tight access on the side yard. Watch fence line and neighbor’s shed.",
  comms: [
    {
      id: "msg1",
      author: "Mike",
      text: "Need to bring the 75' bucket for this one.",
      timestamp: "08:14"
    },
    {
      id: "msg2",
      author: "Jay",
      text: "Driveway is clear, but trailer will need to back in from the street.",
      timestamp: "08:19"
    }
  ]
};

function formatCurrency(value) {
  return "$" + value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function initJobHeader() {
  document.getElementById("jobTitle").textContent = jobData.title;
  document.getElementById("jobStatus").textContent = jobData.status;
  document.getElementById("jobClient").textContent = jobData.client;
  document.getElementById("jobAddressChip").textContent = jobData.address;
  document.getElementById("jobDateChip").textContent = jobData.date;
  document.getElementById("jobWeatherChip").textContent = jobData.weather;

  document.getElementById("snapshotAddress").textContent = jobData.address;
  document.getElementById("snapshotWeather").textContent = jobData.weather;
  document.getElementById("snapshotNotes").textContent = jobData.notes;
}

function initTags() {
  const tagsContainer = document.getElementById("snapshotTags");
  tagsContainer.innerHTML = "";
  jobData.tags.forEach(tag => {
    const span = document.createElement("span");
    span.className = "pill";
    span.textContent = tag;
    tagsContainer.appendChild(span);
  });
}

function initGauges() {
  const total = jobData.totalAmount;
  const allocated = jobData.budgetLines.reduce((sum, line) => sum + line.amount, 0);
  const remaining = Math.max(total - allocated, 0);

  const totalEl = document.getElementById("gaugeTotal");
  const allocatedEl = document.getElementById("gaugeAllocated");
  const remainingEl = document.getElementById("gaugeRemaining");

  totalEl.textContent = formatCurrency(total);
  allocatedEl.textContent = formatCurrency(allocated);
  remainingEl.textContent = formatCurrency(remaining);

  const allocatedPct = total > 0 ? Math.min((allocated / total) * 100, 100) : 0;
  const remainingPct = total > 0 ? Math.min((remaining / total) * 100, 100) : 0;

  const allocatedFill = document.getElementById("gaugeAllocatedFill");
  const remainingFill = document.getElementById("gaugeRemainingFill");

  allocatedFill.style.width = allocatedPct + "%";
  remainingFill.style.width = remainingPct + "%";

  // Color logic
  if (allocatedPct > 95) {
    allocatedFill.classList.add("danger");
  } else if (allocatedPct > 80) {
    allocatedFill.classList.add("warn");
  }

  if (remainingPct < 10) {
    remainingFill.classList.add("danger");
  } else if (remainingPct < 25) {
    remainingFill.classList.add("warn");
  }

  document.getElementById("gaugeTotalTag").textContent = "Job total";
  document.getElementById("gaugeAllocatedTag").textContent = "Allocated to crew";
  document.getElementById("gaugeRemainingTag").textContent = "Unassigned budget";
}

function renderBudgetTable() {
  const tbody = document.getElementById("budgetTableBody");
  tbody.innerHTML = "";

  jobData.budgetLines.forEach(line => {
    const tr = document.createElement("tr");

    const tdRole = document.createElement("td");
    tdRole.innerHTML = `<div class="budget-role">${line.role}</div>`;
    tr.appendChild(tdRole);

    const tdPerson = document.createElement("td");
    tdPerson.innerHTML = `<div class="budget-person">${line.person}</div>`;
    tr.appendChild(tdPerson);

    const tdAmount = document.createElement("td");
    tdAmount.className = "budget-amount";
    tdAmount.textContent = formatCurrency(line.amount);
    tr.appendChild(tdAmount);

    const tdAgreement = document.createElement("td");
    tdAgreement.style.textAlign = "right";

    const badge = document.createElement("span");
    badge.classList.add("badge");
    const dot = document.createElement("span");
    dot.classList.add("badge-dot");
    badge.appendChild(dot);

    const label = document.createElement("span");
    label.textContent = line.agreementStatus;
    badge.appendChild(label);

    if (line.agreementStatus === "Pending") {
      badge.classList.add("pending");
    } else if (line.agreementStatus === "None") {
      badge.classList.add("none");
    }

    tdAgreement.appendChild(badge);
    tr.appendChild(tdAgreement);

    tbody.appendChild(tr);
  });
}

function renderCrewList() {
  const crewList = document.getElementById("crewList");
  crewList.innerHTML = "";

  jobData.budgetLines.forEach(line => {
    const row = document.createElement("div");
    row.className = "crew-row";

    const main = document.createElement("div");
    main.className = "crew-main";

    const name = document.createElement("div");
    name.className = "crew-name";
    name.textContent = line.person;

    const role = document.createElement("div");
    role.className = "crew-role";
    role.textContent = line.role;

    main.appendChild(name);
    main.appendChild(role);

    const amount = document.createElement("div");
    amount.className = "crew-amount";
    amount.textContent = formatCurrency(line.amount);

    const actions = document.createElement("div");
    actions.className = "crew-actions";

    const badge = document.createElement("span");
    badge.classList.add("badge");
    const dot = document.createElement("span");
    dot.classList.add("badge-dot");
    badge.appendChild(dot);
    const label = document.createElement("span");
    label.textContent = line.agreementStatus;
    badge.appendChild(label);

    if (line.agreementStatus === "Pending") {
      badge.classList.add("pending");
    } else if (line.agreementStatus === "None") {
      badge.classList.add("none");
    }

    const btnAgreement = document.createElement("button");
    btnAgreement.className = "btn";
    btnAgreement.textContent = "Agreement";
    btnAgreement.addEventListener("click", () => {
      alert(`Open agreement builder for ${line.person} (${line.role})`);
    });

    actions.appendChild(badge);
    actions.appendChild(btnAgreement);

    row.appendChild(main);
    row.appendChild(amount);
    row.appendChild(actions);

    crewList.appendChild(row);
  });
}

function renderComms() {
  const list = document.getElementById("commsList");
  list.innerHTML = "";

  jobData.comms.forEach(msg => {
    const item = document.createElement("div");
    item.className = "comms-item";

    const meta = document.createElement("div");
    meta.className = "comms-meta";
    meta.innerHTML = `<span>${msg.author}</span><span>${msg.timestamp}</span>`;

    const text = document.createElement("div");
    text.className = "comms-text";
    text.textContent = msg.text;

    item.appendChild(meta);
    item.appendChild(text);
    list.appendChild(item);
  });

  list.scrollTop = list.scrollHeight;
}

function initCommsInput() {
  const input = document.getElementById("commsInput");
  const sendBtn = document.getElementById("commsSend");

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    const now = new Date();
    const timestamp = now.toTimeString().slice(0, 5);

    jobData.comms.push({
      id: "msg" + (jobData.comms.length + 1),
      author: "You",
      text,
      timestamp
    });

    input.value = "";
    renderComms();
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
}

function initCategories() {
  const categoriesRow = document.getElementById("categoriesRow");
  const sections = {
    budget: document.getElementById("sectionBudget"),
    crew: document.getElementById("sectionCrew"),
    comms: document.getElementById("sectionComms"),
    share: document.getElementById("sectionShare")
  };

  categoriesRow.addEventListener("click", e => {
    const pill = e.target.closest(".category-pill");
    if (!pill) return;

    const section = pill.getAttribute("data-section");
    if (!section) return;

    // Toggle active pill
    document.querySelectorAll(".category-pill").forEach(el => {
      el.classList.toggle("active", el === pill);
    });

    // Toggle sections
    Object.keys(sections).forEach(key => {
      sections[key].style.display = key === section ? "block" : "none";
    });
  });
}

function buildJobSummaryText() {
  const total = jobData.totalAmount;
  const allocated = jobData.budgetLines.reduce((sum, line) => sum + line.amount, 0);
  const remaining = Math.max(total - allocated, 0);

  const lines = [];
  lines.push(`Job: ${jobData.title}`);
  lines.push(`Client: ${jobData.client}`);
  lines.push(`Address: ${jobData.address}`);
  lines.push(`Date: ${jobData.date}`);
  lines.push("");
  lines.push(`Total: ${formatCurrency(total)}`);
  lines.push(`Allocated: ${formatCurrency(allocated)}`);
  lines.push(`Remaining: ${formatCurrency(remaining)}`);
  lines.push("");
  lines.push("Splits:");
  jobData.budgetLines.forEach(line => {
    lines.push(`- ${line.role} (${line.person}): ${formatCurrency(line.amount)} [${line.agreementStatus}]`);
  });

  return lines.join("\n");
}

function initSharePanel() {
  const shareQr = document.getElementById("shareQr");
  const shareLink = document.getElementById("shareLink");
  const shareSummary = document.getElementById("shareSummary");
  const shareSystem = document.getElementById("shareSystem");

  shareQr.addEventListener("click", () => {
    // Placeholder – hook into your QR generator
    alert(`Show QR for job ID: ${jobData.id}`);
  });

  shareLink.addEventListener("click", async () => {
    const url = `${window.location.origin}/jobs/job.html?id=${encodeURIComponent(jobData.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Job link copied to clipboard.");
    } catch {
      alert("Job link: " + url);
    }
  });

  shareSummary.addEventListener("click", async () => {
    const summary = buildJobSummaryText();
    try {
      await navigator.clipboard.writeText(summary);
      alert("Job summary copied to clipboard.");
    } catch {
      alert("Job summary:\n\n" + summary);
    }
  });

  shareSystem.addEventListener("click", async () => {
    const summary = buildJobSummaryText();
    const url = `${window.location.origin}/jobs/job.html?id=${encodeURIComponent(jobData.id)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: jobData.title,
          text: summary,
          url
        });
      } catch (err) {
        console.log("Share cancelled or failed", err);
      }
    } else {
      alert("Native share not supported on this device.\n\n" + summary + "\n\n" + url);
    }
  });
}

function initQuickActions() {
  document.getElementById("qaAddCrew").addEventListener("click", () => {
    alert("Open Add Crew flow (modal or separate screen).");
  });

  document.getElementById("qaOfferSplit").addEventListener("click", () => {
    alert("Open Offer Split / Agreement builder.");
  });

  document.getElementById("qaMarkComplete").addEventListener("click", () => {
    alert("Mark job as complete and lock agreements.");
  });

  document.getElementById("btnEditJob").addEventListener("click", () => {
    alert("Open job edit form.");
  });
}

function initJobDashboard() {
  initJobHeader();
  initTags();
  initGauges();
  renderBudgetTable();
  renderCrewList();
  renderComms();
  initCommsInput();
  initCategories();
  initSharePanel();
  initQuickActions();
}

document.addEventListener("DOMContentLoaded", initJobDashboard);
