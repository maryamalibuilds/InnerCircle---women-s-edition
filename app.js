
const STORAGE_KEY = "innercircle_womens_v2";

const defaultData = {
  pin: "",
  displayName: "",
  dailyQuotes: "on",
  moods: [],
  journalEntries: [],
  goals: [],
  savedQuotes: [],
  streak: 0,
  lastActiveDate: ""
};

const defaultQuotes = [
  "You are allowed to take up space.",
  "Softness and strength can exist together.",
  "Peace is productive too.",
  "You do not need to rush your becoming.",
  "A gentle life is still a powerful one.",
  "Joy is not something to earn. It is something to allow."
];

let appData = loadData();

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...defaultData };
  try {
    return { ...defaultData, ...JSON.parse(raw) };
  } catch {
    return { ...defaultData };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  if (!appData.lastActiveDate) {
    appData.streak = 1;
  } else if (appData.lastActiveDate !== today) {
    const last = new Date(appData.lastActiveDate);
    const current = new Date(today);
    const diff = Math.round((current - last) / (1000 * 60 * 60 * 24));
    if (diff === 1) appData.streak += 1;
    else if (diff > 1) appData.streak = 1;
  }
  appData.lastActiveDate = today;
  saveData();
}

function mostLoggedMood() {
  const counts = {};
  appData.moods.forEach(item => counts[item.mood] = (counts[item.mood] || 0) + 1);
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "-";
}

function currentInsight() {
  const latestMood = appData.moods.slice(-1)[0]?.mood;
  if (latestMood === "Stressed" || latestMood === "Tired") {
    return "Your recent mood suggests you may need softness, rest, and less pressure this week.";
  }
  if (latestMood === "Happy" || latestMood === "Motivated" || latestMood === "Calm") {
    return "You seem to be in a grounded phase right now. This could be a good time to move one meaningful goal forward.";
  }
  if (appData.journalEntries.length >= 3) {
    return "Your journaling habit is becoming consistent. Reflection is turning into clarity.";
  }
  return "As you use your space more, your dashboard will feel more personal and more useful.";
}

function ensureUnlockedForInnerPages() {
  const page = document.body.dataset.page;
  if (page !== "home" && !appData.pin) {
    window.location.href = "index.html";
  }
}

function renderHome() {
  const authScreen = document.getElementById("authScreen");
  const appContent = document.getElementById("appContent");
  const unlockBtn = document.getElementById("unlockBtn");
  const pinInput = document.getElementById("pinInput");

  function showApp() {
    authScreen.classList.add("hidden");
    appContent.classList.remove("hidden");
    updateStreak();

    document.getElementById("streakValue").textContent = `${appData.streak} day${appData.streak === 1 ? "" : "s"}`;
    document.getElementById("entryCount").textContent = appData.journalEntries.length;
    document.getElementById("goalCount").textContent = appData.goals.filter(goal => goal.done).length;
    document.getElementById("topMood").textContent = mostLoggedMood();

    const name = appData.displayName?.trim();
    document.getElementById("welcomeMessage").textContent = name
      ? `Welcome back, ${name}. Your private space is ready.`
      : `Welcome back. Your private space is ready.`;

    document.getElementById("insightCard").textContent = currentInsight();
  }

  if (appData.pin) showApp();

  unlockBtn?.addEventListener("click", () => {
    const pin = pinInput.value.trim();
    if (!/^\d{4}$/.test(pin)) {
      alert("Please enter a 4-digit PIN.");
      return;
    }

    if (!appData.pin) {
      appData.pin = pin;
      saveData();
      showApp();
      return;
    }

    if (appData.pin !== pin) {
      alert("Incorrect PIN.");
      return;
    }

    showApp();
  });
}

function renderJournal() {
  const promptEl = document.getElementById("journalPrompt");
  const journalInput = document.getElementById("journalInput");
  const journalList = document.getElementById("journalList");
  const prompts = [
    "What do you need more of this week?",
    "What made you feel safe today?",
    "What are you proud of lately?",
    "What deserves more gentleness in your life right now?",
    "What would peace look like for you this month?"
  ];

  const setPrompt = () => {
    promptEl.textContent = prompts[Math.floor(Math.random() * prompts.length)];
  };

  setPrompt();
  document.getElementById("newPromptBtn")?.addEventListener("click", setPrompt);

  document.getElementById("saveJournalBtn")?.addEventListener("click", () => {
    const text = journalInput.value.trim();
    if (!text) {
      alert("Write something first.");
      return;
    }
    appData.journalEntries.push({ text, date: new Date().toLocaleString() });
    saveData();
    journalInput.value = "";
    drawJournalList();
  });

  document.getElementById("clearJournalBtn")?.addEventListener("click", () => {
    journalInput.value = "";
  });

  function drawJournalList() {
    if (!appData.journalEntries.length) {
      journalList.innerHTML = '<div class="item-card">No journal entries yet.</div>';
      return;
    }
    journalList.innerHTML = appData.journalEntries.slice().reverse().map(entry => `
      <div class="item-card">
        <strong>${entry.date}</strong>
        <div>${entry.text}</div>
      </div>
    `).join("");
  }

  drawJournalList();
}

function renderMood() {
  const history = document.getElementById("moodHistory");
  document.querySelectorAll(".mood-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      appData.moods.push({ mood: btn.dataset.mood, date: new Date().toLocaleString() });
      saveData();
      drawMoodHistory();
    });
  });

  function drawMoodHistory() {
    if (!appData.moods.length) {
      history.innerHTML = '<div class="item-card">No mood entries yet.</div>';
      return;
    }
    history.innerHTML = appData.moods.slice().reverse().map(item => `
      <div class="item-card">
        <strong>${item.mood}</strong>
        <div class="item-meta">${item.date}</div>
      </div>
    `).join("");
  }

  drawMoodHistory();
}

function renderGoals() {
  const goalInput = document.getElementById("goalInput");
  const goalList = document.getElementById("goalList");

  document.getElementById("addGoalBtn")?.addEventListener("click", () => {
    const text = goalInput.value.trim();
    if (!text) {
      alert("Enter a goal first.");
      return;
    }
    appData.goals.push({ text, done: false });
    saveData();
    goalInput.value = "";
    drawGoals();
  });

  window.toggleGoal = function(index) {
    appData.goals[index].done = !appData.goals[index].done;
    saveData();
    drawGoals();
  };

  window.deleteGoal = function(index) {
    appData.goals.splice(index, 1);
    saveData();
    drawGoals();
  };

  function drawGoals() {
    if (!appData.goals.length) {
      goalList.innerHTML = '<div class="item-card">No goals added yet.</div>';
      return;
    }
    goalList.innerHTML = appData.goals.map((goal, index) => `
      <div class="item-card">
        <strong>${goal.text}</strong>
        <div class="button-row">
          <button class="btn ${goal.done ? "btn-secondary" : "btn-primary"}" onclick="toggleGoal(${index})">
            ${goal.done ? "Completed" : "Mark Done"}
          </button>
          <button class="btn btn-secondary" onclick="deleteGoal(${index})">Delete</button>
        </div>
      </div>
    `).join("");
  }

  drawGoals();
}

function renderQuotes() {
  const featured = document.getElementById("featuredQuote");
  const list = document.getElementById("quoteList");
  const customInput = document.getElementById("customQuoteInput");

  function getRandomQuote() {
    const pool = [...defaultQuotes, ...appData.savedQuotes];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function drawFeatured() {
    featured.textContent = appData.dailyQuotes === "off"
      ? "Daily quotes are turned off in settings."
      : getRandomQuote();
  }

  function drawSavedQuotes() {
    if (!appData.savedQuotes.length) {
      list.innerHTML = '<div class="item-card">No custom quotes saved yet.</div>';
      return;
    }
    list.innerHTML = appData.savedQuotes.slice().reverse().map((quote, index) => `
      <div class="item-card">
        <strong>Saved Quote</strong>
        <div>${quote}</div>
        <div class="button-row">
          <button class="btn btn-secondary" onclick="deleteQuote(${appData.savedQuotes.length - 1 - index})">Delete</button>
        </div>
      </div>
    `).join("");
  }

  document.getElementById("newQuoteBtn")?.addEventListener("click", drawFeatured);

  document.getElementById("saveQuoteBtn")?.addEventListener("click", () => {
    const text = customInput.value.trim();
    if (!text) {
      alert("Write a quote first.");
      return;
    }
    appData.savedQuotes.push(text);
    saveData();
    customInput.value = "";
    drawSavedQuotes();
    drawFeatured();
  });

  window.deleteQuote = function(index) {
    appData.savedQuotes.splice(index, 1);
    saveData();
    drawSavedQuotes();
    drawFeatured();
  };

  drawFeatured();
  drawSavedQuotes();
}

function renderSettings() {
  const displayName = document.getElementById("displayName");
  const affirmationsToggle = document.getElementById("affirmationsToggle");

  displayName.value = appData.displayName || "";
  affirmationsToggle.value = appData.dailyQuotes || "on";

  document.getElementById("saveSettingsBtn")?.addEventListener("click", () => {
    appData.displayName = displayName.value.trim();
    appData.dailyQuotes = affirmationsToggle.value;
    saveData();
    alert("Settings saved.");
  });

  document.getElementById("lockBtn")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  document.getElementById("exportBtn")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "innercircle-data.json";
    link.click();
  });

  document.getElementById("clearDataBtn")?.addEventListener("click", () => {
    if (!confirm("Clear all saved app data from this browser?")) return;
    localStorage.removeItem(STORAGE_KEY);
    appData = loadData();
    window.location.href = "index.html";
  });
}

ensureUnlockedForInnerPages();

const page = document.body.dataset.page;
if (page === "home") renderHome();
if (page === "journal") renderJournal();
if (page === "mood") renderMood();
if (page === "goals") renderGoals();
if (page === "quotes") renderQuotes();
if (page === "settings") renderSettings();
