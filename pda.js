const CONFIG = {
  TIME_LIMIT_MIN: 10,
  ROUND_SIZE: 10,
  // Paste a Google Apps Script web app URL here to collect everyone's results in a Sheet.
  // Leave empty to skip sending (students can still copy their results).
  SUBMIT_URL: ""
};

const LABELS = [
  { id: "Positive", cls: "pos", hint: "happy or praising" },
  { id: "Negative", cls: "neg", hint: "unhappy or criticising" },
  { id: "Neutral", cls: "neu", hint: "facts or balanced" }
];

const shuffle = (items) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

const SEEN_KEY = "practice-seen-ids";
const seen = new Set();
try {
  JSON.parse(localStorage.getItem(SEEN_KEY) || "[]").forEach((id) => seen.add(id));
} catch (error) {
  // Storage may be unavailable; practice rounds still work for this visit.
}
const rememberSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch (error) {
    // Storage may be unavailable; practice rounds still work for this visit.
  }
};

// Picks a balanced round of new tasks. Used tasks are skipped until the pool runs out.
const buildPracticeSet = () => {
  let fresh = POOL.filter((task) => !seen.has(task.id));
  if (fresh.length < CONFIG.ROUND_SIZE) {
    seen.clear();
    fresh = [...POOL];
  }
  const perLabel = Math.floor(CONFIG.ROUND_SIZE / LABELS.length);
  const chosen = [];
  LABELS.forEach((label) => {
    chosen.push(...shuffle(fresh.filter((task) => task.a === label.id)).slice(0, perLabel));
  });
  const rest = shuffle(fresh.filter((task) => !chosen.includes(task)));
  chosen.push(...rest.slice(0, CONFIG.ROUND_SIZE - chosen.length));
  chosen.forEach((task) => seen.add(task.id));
  rememberSeen();
  return shuffle(chosen).map((task) => ({ ...task }));
};
const buildLabelOrder = () => shuffle([...LABELS]).map((label) => ({ ...label }));

/* Add or edit tasks here. a = answer key, why = shown in the review. */
const POOL = [
  // Positive
  {t:"The laptops start fast and the internet stayed stable all morning.", a:"Positive", why:"Two clear good points and no complaint."},
  {t:"I did not expect to enjoy this exercise so much!", a:"Positive", why:"“Did not expect” is not negative here. The writer enjoyed it."},
  {t:"My teammate explained the rule so clearly that I finally understood it.", a:"Positive", why:"The writer is grateful and satisfied."},
  {t:"The new lab chairs are comfortable and the room stays cool.", a:"Positive", why:"Praise for two things."},
  {t:"Finishing my first full practice round made me feel proud.", a:"Positive", why:"The writer states a happy feeling."},
  {t:"The trainer answered every question patiently, and I left with a clear plan.", a:"Positive", why:"Praise for the trainer and a good result."},
  {t:"This keyboard is a pleasure to type on.", a:"Positive", why:"Direct praise."},
  {t:"I am so glad the bus came on time today.", a:"Positive", why:"The writer says they are glad."},
  {t:"The lunch was tasty and the portion was generous.", a:"Positive", why:"Two good points about the food."},
  {t:"Wow, my code worked on the first try, and I can’t stop smiling.", a:"Positive", why:"Excitement and happiness."},
  // Negative
  {t:"I waited two hours and nobody told me what was happening.", a:"Negative", why:"The writer is frustrated about the wait and the silence."},
  {t:"Great, another power cut right when I was about to submit. Just perfect.", a:"Negative", why:"Sarcasm. The words are positive but the meaning is anger."},
  {t:"I would not recommend this phone to anyone.", a:"Negative", why:"A direct warning against the product."},
  {t:"The screen froze three times and I lost all my work.", a:"Negative", why:"Repeated problem and a real loss."},
  {t:"Oh wonderful, the Wi-Fi died again during the test.", a:"Negative", why:"Sarcasm. “Wonderful” means the opposite here."},
  {t:"The instructions were confusing and the deadline was unfair.", a:"Negative", why:"Two complaints."},
  {t:"I am tired of the noise outside because I cannot focus.", a:"Negative", why:"The writer is annoyed and explains why."},
  {t:"The charger broke after one day, and the shop refused to help.", a:"Negative", why:"A broken product and poor service."},
  {t:"Nobody replied to my message, which made me feel ignored.", a:"Negative", why:"The writer states a hurt feeling."},
  {t:"The food arrived cold and the waiter was rude.", a:"Negative", why:"Two complaints."},
  // Neutral
  {t:"The class begins at 9:00 and ends at 12:30.", a:"Neutral", why:"A fact with no feeling."},
  {t:"The app has three screens: home, tasks and results.", a:"Neutral", why:"Describes the app and gives no opinion."},
  {t:"The instructor explains well, but the room is too hot to concentrate.", a:"Neutral", why:"One good and one bad point of equal strength, so the rules say Neutral."},
  {t:"The bus is cheap, but it is often late.", a:"Neutral", why:"A good point and a bad point of equal weight."},
  {t:"The report is due on Friday and must be two pages long.", a:"Neutral", why:"Only facts about the task."},
  {t:"I received the email at 10:15 and forwarded it to my group.", a:"Neutral", why:"A report of actions with no feeling."},
  {t:"The new tool is fast, but it crashes when I upload large files.", a:"Neutral", why:"A strong good point and a strong bad point, so Neutral."},
  {t:"Each room has four students and one laptop per person.", a:"Neutral", why:"A fact about the setup."},
  {t:"The library opens on Monday and closes on Saturday.", a:"Neutral", why:"Opening times only."},
  {t:"The camera takes sharp photos, yet the battery barely lasts a day.", a:"Neutral", why:"Praise and criticism of equal weight."},
  // More tasks
  { t: "The new course notes are clear, and I finished the lesson early.", a: "Positive", why: "Praise and a good result." },
  { t: "I am grateful the trainer stayed late to help me.", a: "Positive", why: "The writer is thankful." },
  { t: "That was the smoothest upload I have ever done.", a: "Positive", why: "Strong praise." },
  { t: "My group worked well together and we were all happy with the result.", a: "Positive", why: "Happy about teamwork and the outcome." },
  { t: "The market had fresh fruit at a fair price today.", a: "Positive", why: "Two good points." },
  { t: "I was nervous about the test, but it went better than I hoped.", a: "Positive", why: "Nervous at first, but the outcome is positive." },
  { t: "This tutorial made a hard topic feel easy.", a: "Positive", why: "Direct praise." },
  { t: "The power came back quickly and I did not lose any work.", a: "Positive", why: "Relief and a good result." },
  { t: "What a lovely surprise, my order came a day early!", a: "Positive", why: "Real delight. Not sarcasm." },
  { t: "Best study spot ever: quiet, bright and with fast internet.", a: "Positive", why: "Strong praise." },
  { t: "The website kept logging me out, and I had to start the form again.", a: "Negative", why: "A repeated problem that wasted time." },
  { t: "I am disappointed that the results were not posted on time.", a: "Negative", why: "The writer says they are disappointed." },
  { t: "Brilliant, my phone died exactly when the code arrived.", a: "Negative", why: "Sarcasm. “Brilliant” means the opposite here." },
  { t: "The room was so crowded that I could not hear the trainer.", a: "Negative", why: "A complaint about the room." },
  { t: "I regret buying this bag because the zip broke in a week.", a: "Negative", why: "Regret and a broken product." },
  { t: "The support team never answered my three emails.", a: "Negative", why: "Poor service." },
  { t: "Thanks a lot for moving the exam without telling anyone.", a: "Negative", why: "Sarcasm. The writer is upset." },
  { t: "The video kept stopping, and the sound was terrible.", a: "Negative", why: "Two complaints." },
  { t: "I felt embarrassed when the instructions turned out to be wrong.", a: "Negative", why: "A negative feeling caused by bad instructions." },
  { t: "The taxi driver charged double and refused to give change.", a: "Negative", why: "Two complaints." },
  { t: "The workshop has twelve seats and starts at 2:00 in the afternoon.", a: "Neutral", why: "Facts only." },
  { t: "I uploaded the file, and then I closed the laptop.", a: "Neutral", why: "A report of actions with no feeling." },
  { t: "The tool is easy to learn, but the free plan has very few features.", a: "Neutral", why: "One good and one bad point of equal weight." },
  { t: "The lab is on the second floor next to the library.", a: "Neutral", why: "A location. No feeling." },
  { t: "The price went from 20,000 to 25,000 shillings this month.", a: "Neutral", why: "A fact. It states a change but gives no opinion." },
  { t: "The phone looks great, but the battery is poor.", a: "Neutral", why: "Praise and criticism of equal weight." },
  { t: "Please bring your laptop and a charger on Monday.", a: "Neutral", why: "An instruction." },
  { t: "The report has five sections and two charts.", a: "Neutral", why: "A description." },
  { t: "The course is free and takes about six hours each week.", a: "Neutral", why: "Facts only." },
  { t: "Their service is fast, but their prices are high.", a: "Neutral", why: "A good and a bad point of equal weight." }
];
POOL.forEach((task, index) => { task.id = index; });

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[character]));

const labelById = Object.fromEntries(LABELS.map((label) => [label.id, label]));
const getLabelClass = (labelId) => labelById[labelId]?.cls || "";

const state = {
  name: "",
  tasks: [],
  labels: [],
  answers: [],
  currentIndex: 0,
  endsAt: 0,
  timerId: null,
  finished: false,
  summary: ""
};

function show(sectionId) {
  ["intro", "work", "done"].forEach((section) => {
    const el = $(section);
    if (el) {
      el.classList.toggle("hidden", section !== sectionId);
    }
  });
  window.scrollTo({ top: 0, behavior: "auto" });
}

function updateMetaText() {
  const meta = $("meta");
  if (meta) {
    const total = state.tasks.length || CONFIG.ROUND_SIZE;
    meta.textContent = `${total} tasks, ${CONFIG.TIME_LIMIT_MIN} minutes. Unanswered tasks count as wrong.`;
  }
}

function resetNameButton() {
  const nameInput = $("name");
  const startButton = $("start");
  if (nameInput && startButton) {
    startButton.disabled = nameInput.value.trim().length < 2;
  }
}

function buildOptions() {
  const opts = $("opts");
  if (!opts) return;

  const labelOrder = state.labels.length ? state.labels : LABELS;

  opts.innerHTML = labelOrder.map((label, index) => `
    <button class="opt ${label.cls}" data-id="${label.id}" aria-pressed="false">
      ${index + 1}. ${label.id}<small>${label.hint}</small>
    </button>
  `).join("");

  opts.querySelectorAll(".opt").forEach((button) => {
    button.addEventListener("click", () => pick(button.dataset.id));
  });
}

function prepareRound() {
  state.tasks = buildPracticeSet();
  state.labels = buildLabelOrder();
  state.answers = Array(state.tasks.length).fill(null);
  state.currentIndex = 0;
  state.finished = false;
  const copyButton = $("copy");
  if (copyButton) copyButton.textContent = "Copy my results";
  const sendMessage = $("sendmsg");
  if (sendMessage) sendMessage.textContent = "";
  state.endsAt = Date.now() + CONFIG.TIME_LIMIT_MIN * 60 * 1000;
}

function start() {
  const nameInput = $("name");
  if (!nameInput) return;

  state.name = nameInput.value.trim();
  if (!state.name) {
    nameInput.focus();
    return;
  }

  prepareRound();
  buildOptions();
  show("work");
  render();
  clock();
  if (state.timerId) {
    clearInterval(state.timerId);
  }
  state.timerId = setInterval(clock, 500);
}

function clock() {
  const timer = $("timer");
  if (!timer) return;

  const left = Math.max(0, state.endsAt - Date.now());
  const minutes = Math.floor(left / 60000);
  const seconds = Math.floor((left % 60000) / 1000);

  timer.textContent = `Time left ${minutes}:${String(seconds).padStart(2, "0")}`;
  timer.classList.toggle("low", left < 60000);

  if (left === 0 && !state.finished) {
    finish(true);
  }
}

function render() {
  const task = state.tasks[state.currentIndex];
  const currentAnswer = state.answers[state.currentIndex];
  const count = $("count");
  const fill = $("fill");
  const sent = $("sent");
  const back = $("back");
  const next = $("next");
  const finishButton = $("finish");
  const opts = $("opts");

  if (!task || !count || !fill || !sent || !back || !next || !finishButton || !opts) return;

  const answeredCount = state.answers.filter(Boolean).length;
  const total = state.tasks.length;
  count.textContent = `Task ${state.currentIndex + 1} of ${total}`;
  fill.style.width = `${(answeredCount / total) * 100}%`;
  sent.textContent = task.t;
  sent.className = `sent ${currentAnswer ? getLabelClass(currentAnswer) : ""}`.trim();

  opts.querySelectorAll(".opt").forEach((button) => {
    const selected = button.dataset.id === currentAnswer;
    button.setAttribute("aria-pressed", String(selected));
  });

  back.disabled = state.currentIndex === 0;
  const isLastTask = state.currentIndex === state.tasks.length - 1;
  next.classList.toggle("hidden", isLastTask);
  finishButton.classList.toggle("hidden", !isLastTask);
}

function pick(labelId) {
  state.answers[state.currentIndex] = labelId;
  render();
}

function go(targetIndex) {
  if (targetIndex < 0 || targetIndex >= state.tasks.length) return;
  state.currentIndex = targetIndex;
  render();
}

document.addEventListener("keydown", (event) => {
  const workSection = $("work");
  const target = event.target;

  if (!workSection || workSection.classList.contains("hidden")) return;
  if (target && target.closest("input, textarea")) return;

  if (event.key >= "1" && event.key <= String(LABELS.length)) {
    const shown = state.labels.length ? state.labels : LABELS;
    pick(shown[Number(event.key) - 1].id);
  }

  if (event.key === "ArrowRight") {
    go(state.currentIndex + 1);
  }

  if (event.key === "ArrowLeft") {
    go(state.currentIndex - 1);
  }
});

function finish(timeUp) {
  const blanks = state.answers.filter((answer) => !answer).length;

  if (!timeUp && blanks > 0 && !confirm(`${blanks} task(s) have no label and will count as wrong. Finish anyway?`)) {
    return;
  }

  state.finished = true;
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }

  const total = state.tasks.length;
  const score = state.answers.filter((answer, index) => answer === state.tasks[index].a).length;
  const pct = Math.round((score / total) * 100);
  const scoreText = `${score} out of ${total} (${pct}%)`;

  const scoreElement = $("score");
  const verdictElement = $("verdict");
  const reviewElement = $("review");

  if (scoreElement) {
    scoreElement.textContent = scoreText;
  }

  if (verdictElement) {
    verdictElement.textContent = `${timeUp ? "Time is up. " : ""}${pct >= 90
      ? "Strong work. Real projects ask for this level of accuracy."
      : pct >= 70
        ? "Good start. Read the rules again and look at the tasks you missed."
        : "Keep practising. Most beginners miss sarcasm and balanced texts at first."}`;
  }

  if (reviewElement) {
    reviewElement.innerHTML = state.tasks.map((task, index) => {
      const selected = state.answers[index];
      const isCorrect = selected === task.a;
      return `
        <div class="row">
          <p><mark class="k ${getLabelClass(task.a)}">${esc(task.t)}</mark></p>
          <p>
            <span class="${isCorrect ? "ok" : "no"}">${isCorrect ? "Correct" : "Not matching"}</span>
            Your label: ${esc(selected || "none")}. Key: ${esc(task.a)}.
          </p>
          <p class="muted">${esc(task.why)}</p>
        </div>
      `;
    }).join("");
  }

  state.summary = [
    `Name: ${state.name}`,
    `Score: ${score}/${total}`,
    `Answers: ${state.answers.map((answer) => answer || "-").join(", ")}`
  ].join("\n");

  show("done");
  send({
    name: state.name,
    score,
    total,
    answers: state.answers,
    finishedAt: new Date().toISOString()
  });
}

function send(payload) {
  const sendMessage = $("sendmsg");
  if (!sendMessage) return;

  if (!CONFIG.SUBMIT_URL) {
    sendMessage.textContent = "Results are not being collected. Use “Copy my results” to share them.";
    return;
  }

  fetch(CONFIG.SUBMIT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload)
  })
    .then(() => {
      sendMessage.textContent = "Your result was sent.";
    })
    .catch(() => {
      sendMessage.textContent = "Sending failed. Use “Copy my results” and share them instead.";
    });
}

function copySummary() {
  const copyButton = $("copy");
  if (!copyButton) return;

  const fallbackPrompt = () => {
    window.prompt("Copy this text:", state.summary);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(state.summary)
      .then(() => {
        copyButton.textContent = "Copied";
      })
      .catch(fallbackPrompt);
    return;
  }

  fallbackPrompt();
}

updateMetaText();
resetNameButton();

$("name").addEventListener("input", resetNameButton);
$("start").addEventListener("click", start);
$("back").addEventListener("click", () => go(state.currentIndex - 1));
$("next").addEventListener("click", () => go(state.currentIndex + 1));
$("finish").addEventListener("click", () => finish(false));
$("again").addEventListener("click", () => {
  if (!state.name) {
    location.reload();
    return;
  }

  prepareRound();
  buildOptions();
  show("work");
  render();
  clock();
  if (state.timerId) {
    clearInterval(state.timerId);
  }
  state.timerId = setInterval(clock, 500);
});
$("copy").addEventListener("click", copySummary);
