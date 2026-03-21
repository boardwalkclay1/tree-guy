// ============================================================
// Real Tree Guy OS — Calendar Module (IndexedDB Version)
// ============================================================

import { initDB, save, getAll, remove } from "../../assets/js/db.js";

await initDB();

// DOM ELEMENTS
const grid = document.getElementById("calendarGrid");
const monthLabel = document.getElementById("monthLabel");
const modal = document.getElementById("modal");

const eventTitle = document.getElementById("eventTitle");
const eventType = document.getElementById("eventType");
const contractLabel = document.getElementById("contractLabel");
const contractId = document.getElementById("contractId");
const eventNotes = document.getElementById("eventNotes");

let current = new Date();
let selectedDate = null;

// ============================================================
// OPEN / CLOSE MODAL
// ============================================================

function openModal(dateStr) {
  selectedDate = dateStr;
  modal.style.display = "flex";
  document.getElementById("modalDate").textContent = dateStr;

  eventTitle.value = "";
  eventType.value = "task";
  contractId.value = "";
  eventNotes.value = "";
  contractLabel.classList.add("hidden");
  contractId.classList.add("hidden");
}

function closeModal() {
  modal.style.display = "none";
}

document.getElementById("closeModal").onclick = closeModal;

// Show contract ID field only when needed
eventType.onchange = () => {
  if (eventType.value === "contract") {
    contractLabel.classList.remove("hidden");
    contractId.classList.remove("hidden");
  } else {
    contractLabel.classList.add("hidden");
    contractId.classList.add("hidden");
  }
};

// ============================================================
// SAVE EVENT
// ============================================================

document.getElementById("saveEvent").onclick = async () => {
  const eventObj = {
    id: crypto.randomUUID(),
    date: selectedDate,
    title: eventTitle.value,
    type: eventType.value,
    contractId: contractId.value,
    notes: eventNotes.value
  };

  await save("calendar", eventObj);

  closeModal();
  render();
};

// ============================================================
// RENDER CALENDAR
// ============================================================

async function render() {
  grid.innerHTML = "";

  const year = current.getFullYear();
  const month = current.getMonth();

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  monthLabel.textContent =
    first.toLocaleString("default", { month: "long" }) + " " + year;

  const startDay = first.getDay();
  const totalDays = last.getDate();

  const events = await getAll("calendar");

  // Empty cells before month starts
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-day empty";
    grid.appendChild(empty);
  }

  // Actual days
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${month + 1}-${d}`;
    const cell = document.createElement("div");
    cell.className = "cal-day";

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = d;
    cell.appendChild(num);

    // Highlight today
    const today = new Date();
    if (
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      cell.classList.add("today");
    }

    // Render event pills
    const todaysEvents = events.filter(e => e.date === dateStr);
    todaysEvents.forEach(ev => {
      const pill = document.createElement("div");
      pill.className = "event-pill " + ev.type;
      pill.textContent = ev.title;

      // Click pill to delete event
      pill.onclick = async (e) => {
        e.stopPropagation(); // prevent opening modal
        await remove("calendar", ev.id);
        render();
      };

      cell.appendChild(pill);
    });

    // Click day to add event
    cell.onclick = () => openModal(dateStr);

    grid.appendChild(cell);
  }
}

// ============================================================
// MONTH NAVIGATION
// ============================================================

document.getElementById("prev").onclick = () => {
  current.setMonth(current.getMonth() - 1);
  render();
};

document.getElementById("next").onclick = () => {
  current.setMonth(current.getMonth() + 1);
  render();
};

// INITIAL RENDER
render();
