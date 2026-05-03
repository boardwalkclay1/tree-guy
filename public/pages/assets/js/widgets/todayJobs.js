import { Storage } from "../utils/storage.js";

const JOB_KEY = "rtgJobs";
let jobIndex = 0;

export function initTodayJobs() {
  renderJob();
  bindEvents();
}

function loadJobs() {
  const jobs = Storage.get(JOB_KEY);
  return jobs.filter(j => isToday(j.date));
}

function isToday(dateStr) {
  const today = new Date();
  const d = new Date(dateStr);
  return d.toDateString() === today.toDateString();
}

function renderJob() {
  const jobs = loadJobs();
  const display = document.getElementById("jobDisplay");

  if (!display) return;

  if (jobs.length === 0) {
    display.innerHTML = `<p class="rtg-no-jobs">No jobs scheduled today.</p>`;
    return;
  }

  if (jobIndex < 0) jobIndex = jobs.length - 1;
  if (jobIndex >= jobs.length) jobIndex = 0;

  const job = jobs[jobIndex];

  display.innerHTML = `
    <h3>${job.client}</h3>
    <p><strong>Time:</strong> ${job.time}</p>
    <p><strong>Address:</strong> ${job.address}</p>
    <p><strong>Notes:</strong> ${job.notes || "None"}</p>
    <p><strong>Saved Location:</strong> ${job.savedLocation || "None"}</p>
  `;
}

function bindEvents() {
  document.getElementById("jobPrev")?.addEventListener("click", () => {
    jobIndex--;
    renderJob();
  });

  document.getElementById("jobNext")?.addEventListener("click", () => {
    jobIndex++;
    renderJob();
  });

  document.getElementById("jobDone")?.addEventListener("click", markJobDone);
  document.getElementById("jobSaveLoc")?.addEventListener("click", saveJobLocation);
  document.getElementById("jobAddNote")?.addEventListener("click", addJobNote);
}

function markJobDone() {
  const jobs = loadJobs();
  jobs.splice(jobIndex, 1);
  Storage.set(JOB_KEY, jobs);
  jobIndex = 0;
  renderJob();
}

function saveJobLocation() {
  navigator.geolocation.getCurrentPosition(pos => {
    const jobs = loadJobs();
    const job = jobs[jobIndex];

    job.savedLocation = `${pos.coords.latitude}, ${pos.coords.longitude}`;
    Storage.set(JOB_KEY, jobs);
    renderJob();
  });
}

function addJobNote() {
  const note = prompt("Add a note:");
  if (!note) return;

  const jobs = loadJobs();
  const job = jobs[jobIndex];

  job.notes = note;
  Storage.set(JOB_KEY, jobs);
  renderJob();
}
