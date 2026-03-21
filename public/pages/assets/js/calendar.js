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

function loadEvents() {
  return JSON.parse(localStorage.getItem("rtg_calendar_events")) || [];
}
function saveEvents(events) {
  localStorage.setItem("rtg_calendar_events", JSON.stringify(events));
}

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

eventType.onchange = () => {
  if (eventType.value === "contract") {
    contractLabel.classList.remove("hidden");
    contractId.classList.remove("hidden");
  } else {
    contractLabel.classList.add("hidden");
    contractId.classList.add("hidden");
  }
};

document.getElementById("closeModal").onclick = closeModal;

document.getElementById("saveEvent").onclick = () => {
  const events = loadEvents();

  events.push({
    date: selectedDate,
    title: eventTitle.value,
    type: eventType.value,
    contractId: contractId.value,
    notes: eventNotes.value
  });

  saveEvents(events);
  closeModal();
  render();
};

function render() {
  grid.innerHTML = "";

  const year = current.getFullYear();
  const month = current.getMonth();

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  monthLabel.textContent = first.toLocaleString("default", { month: "long" }) + " " + year;

  const startDay = first.getDay();
  const totalDays = last.getDate();

  const events = loadEvents();

  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-day empty";
    grid.appendChild(empty);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${month + 1}-${d}`;
    const cell = document.createElement("div");
    cell.className = "cal-day";

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = d;
    cell.appendChild(num);

    const todays = new Date();
    if (
      d === todays.getDate() &&
      month === todays.getMonth() &&
      year === todays.getFullYear()
    ) {
      cell.classList.add("today");
    }

    const todaysEvents = events.filter(e => e.date === dateStr);
    todaysEvents.forEach(ev => {
      const pill = document.createElement("div");
      pill.className = "event-pill " + ev.type;
      pill.textContent = ev.title;
      cell.appendChild(pill);
    });

    cell.onclick = () => openModal(dateStr);
    grid.appendChild(cell);
  }
}

document.getElementById("prev").onclick = () => {
  current.setMonth(current.getMonth() - 1);
  render();
};
document.getElementById("next").onclick = () => {
  current.setMonth(current.getMonth() + 1);
  render();
};

render();
