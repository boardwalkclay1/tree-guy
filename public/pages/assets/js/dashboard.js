// ============================================================
// REAL TREE GUY — DASHBOARD JS (FINAL BUILD)
// Clock • Sidebar • Weather • Compass • Widgets
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ============================================================
  // CLOCK
  // ============================================================
  const clockEl = document.getElementById("rtgClock");

  function updateClock() {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }
  }

  updateClock();
  setInterval(updateClock, 1000);


  // ============================================================
  // SIDEBAR TOGGLE (LOGO + BURGER)
  // ============================================================
  const burger = document.getElementById("rtgBurger");
  const sidemenu = document.getElementById("rtgSidemenu");
  const logo = document.querySelector(".rtg-logo");

  function toggleMenu() {
    sidemenu.classList.toggle("open");
  }

  if (burger) burger.addEventListener("click", toggleMenu);
  if (logo) logo.addEventListener("click", toggleMenu);


  // ============================================================
  // WEATHER (FREE API + REAL LOCATION)
  // ============================================================
  async function getLocation() {
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve({ lat: 34.0, lon: -84.0 }) // fallback ATL
      );
    });
  }

  async function getWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const res = await fetch(url);
    return res.json();
  }

  function applyWeatherBackground(code) {
    let bg = "/assets/img/weather/default.jpg";

    if (code === 0 || code === 1) bg = "/assets/img/weather/sunny.jpg";
    else if (code === 2) bg = "/assets/img/weather/partly.jpg";
    else if (code === 3) bg = "/assets/img/weather/cloudy.jpg";
    else if (code >= 51 && code <= 67) bg = "/assets/img/weather/rain.jpg";
    else if (code >= 71 && code <= 77) bg = "/assets/img/weather/snow.jpg";
    else if (code >= 95) bg = "/assets/img/weather/storm.jpg";

    document.body.style.background = `url('${bg}') center/cover fixed`;
  }

  async function loadWeather() {
    const { lat, lon } = await getLocation();
    const data = await getWeather(lat, lon);

    if (data && data.current_weather) {
      applyWeatherBackground(data.current_weather.weathercode);
    }
  }

  loadWeather();


  // ============================================================
  // COMPASS (REAL DEVICE ORIENTATION)
  // ============================================================
  const compassEl = document.getElementById("rtgCompass");

  if (compassEl) {
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", e => {
        if (e.webkitCompassHeading) {
          compassEl.style.transform = `rotate(${e.webkitCompassHeading * -1}deg)`;
        } else if (e.alpha !== null) {
          compassEl.style.transform = `rotate(${e.alpha * -1}deg)`;
        }
      });
    } else {
      compassEl.style.opacity = "0.5";
    }
  }


  // ============================================================
  // STORAGE UTILS
  // ============================================================
  const Storage = {
    get(key, fallback = []) {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };


  // ============================================================
  // WIDGET 1 — TODAY'S JOBS
  // ============================================================
  const JOB_KEY = "rtgJobs";
  let jobIndex = 0;

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

  renderJob();


  // ============================================================
  // WIDGET 2 — JOB TIMER
  // ============================================================
  let timerInterval;
  let seconds = 0;

  const timerDisplay = document.getElementById("timerDisplay");
  const timerStart = document.getElementById("timerStart");
  const timerStop = document.getElementById("timerStop");
  const timerReset = document.getElementById("timerReset");

  if (timerDisplay) {
    timerStart.addEventListener("click", () => {
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        seconds++;
        timerDisplay.textContent = formatTime(seconds);
      }, 1000);
    });

    timerStop.addEventListener("click", () => {
      clearInterval(timerInterval);
    });

    timerReset.addEventListener("click", () => {
      clearInterval(timerInterval);
      seconds = 0;
      timerDisplay.textContent = "00:00:00";
    });
  }

  function formatTime(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }


  // ============================================================
  // WIDGET 3 — PHOTO CAPTURE
  // ============================================================
  const photoVideo = document.getElementById("photoPreview");
  const photoGallery = document.getElementById("photoGallery");
  const takePhoto = document.getElementById("takePhoto");

  if (photoVideo) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => photoVideo.srcObject = stream);

    takePhoto.addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = photoVideo.videoWidth;
      canvas.height = photoVideo.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(photoVideo, 0, 0);

      const img = document.createElement("img");
      img.src = canvas.toDataURL("image/png");
      img.className = "rtg-photo-thumb";

      photoGallery.appendChild(img);
    });
  }


  // ============================================================
  // WIDGET 4 — QUICK DIAL
  // ============================================================
  const quickDialList = document.getElementById("quickDialList");

  if (quickDialList) {
    const customers = Storage.get("rtgCustomers");

    customers.forEach(c => {
      const item = document.createElement("div");
      item.className = "quickdial-item";

      item.innerHTML = `
        <h3>${c.name}</h3>
        <p>${c.phone}</p>
        <p>${c.address}</p>

        <div class="quickdial-actions">
          <button class="call-btn" onclick="window.location.href='tel:${c.phone}'">Call</button>
          <button class="text-btn" onclick="window.location.href='sms:${c.phone}'">Text</button>
          <button class="map-btn" onclick="window.open('https://maps.google.com/?q=${encodeURIComponent(c.address)}')">Map</button>
        </div>
      `;

      quickDialList.appendChild(item);
    });
  }

});
