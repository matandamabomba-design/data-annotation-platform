/* ---------- Firebase settings: paste yours from Project settings > Your apps > Web app ---------- */
const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
const FB = "https://www.gstatic.com/firebasejs/10.14.1/";

/* ---------- Jobs: edit or add your own ---------- */
const LABELS = ["Positive", "Negative", "Neutral"];

const JOBS = [
  {
    id: "j1",
    type: "bid",
    title: "Label 150 customer reviews for an online shop",
    client: "Small online retailer",
    pay: "$4 per hour",
    seats: "2 seats",
    cap: "5 - 10 h/week",
    short: "Mark each review as positive, negative or neutral. The client sends the full guidelines to the freelancer they choose.",
    detail: "The client needs 150 short customer reviews labelled within one week. They want someone careful who follows a short rule sheet and flags unclear reviews instead of guessing. Any tool is fine: Labelbox, CVAT or a spreadsheet.",
    ok: "The pay is realistic, the task is described, and the client asks for care, not a fee.",
    qualification: {
      pass: 4,
      items: [
        { q: "The trainer arrived at 8:30 and the session started at 9:00.", a: "Neutral", why: "Times only. No feeling." },
        { q: "Thanks for nothing. The shop closed the day I arrived.", a: "Negative", why: "Sarcasm. Label the meaning, which is anger." },
        { q: "I love how easy the new dashboard is to use.", a: "Positive", why: "Direct praise." },
        { q: "The screen is bright, but the sound is very weak.", a: "Neutral", why: "One good and one bad point of equal weight." },
        { q: "Nobody should buy this laptop. It overheats within minutes.", a: "Negative", why: "A warning against the product." },
      ],
    },
    workItems: [
      { q: "The delivery arrived early and everything was packed carefully.", a: "Positive", why: "The customer is pleased with the early, careful delivery." },
      { q: "I waited two weeks and nobody replied to my support request.", a: "Negative", why: "The customer is frustrated about the delay and lack of response." },
      { q: "The order contains three notebooks and a blue pen.", a: "Neutral", why: "This is a factual description without an opinion." },
    ],
  },
  {
    id: "j2",
    type: "bid",
    scam: true,
    title: "Easy data entry. Earn $30 per hour, start today!",
    client: "Global Data Jobs Ltd",
    pay: "$30 per hour",
    seats: "More than 100 seats",
    cap: "Any time",
    short: "No experience needed. Pay a small fee for your software licence and start immediately.",
    detail: "To activate your account, send a $15 licence fee by mobile money, then send your ID photo and bank details on WhatsApp. Work starts today.",
    flags: [
      "It asks you to pay a fee before work. Real platforms never charge to apply.",
      "The pay is far too high for no experience.",
      "It moves you to WhatsApp and asks for your ID and bank details.",
      "It never describes the actual task.",
    ],
  },
  {
    id: "j3",
    type: "qual",
    title: "Text Sentiment Labeling",
    pay: "~$0.02 per task",
    seats: "More than 50 seats",
    cap: "5 - 10 h/week",
    pass: 4,
    short: "Read the project rules, then pass a short qualification test to unlock paid-style tasks.",
    items: [
      { q: "The trainer arrived at 8:30 and the session started at 9:00.", a: "Neutral", why: "Times only. No feeling." },
      { q: "Thanks for nothing. The shop closed the day I arrived.", a: "Negative", why: "Sarcasm. Label the meaning, which is anger." },
      { q: "I love how easy the new dashboard is to use.", a: "Positive", why: "Direct praise." },
      { q: "The screen is bright, but the sound is very weak.", a: "Neutral", why: "One good and one bad point of equal weight." },
      { q: "Nobody should buy this laptop. It overheats within minutes.", a: "Negative", why: "A warning against the product." },
    ],
  },
  {
    id: "j4",
    type: "pool",
    title: "Which answer is better?",
    pay: "~$0.01 per task",
    seats: "More than 50 seats",
    cap: "5 - 30 h/week",
    short: "Read two AI answers to the same question and choose the better one.",
    items: [
      {
        q: "What is the capital of Uganda?",
        good: "Kampala is the capital and largest city of Uganda.",
        bad: "The capital of Uganda is Entebbe, where the airport is.",
        why: "Entebbe has the airport but is not the capital. Check facts.",
      },
      {
        q: "Explain what a refund is in one sentence.",
        good: "A refund is money returned to a customer after they cancel or return a purchase.",
        bad: "Refunds are a topic in business and there are many types and rules in many countries.",
        why: "The first answer does what was asked. The second avoids the question.",
      },
      {
        q: "How can I stay safe from online job scams?",
        good: "Never pay a fee to get a job, check the company on its official website, and keep talking on the official platform.",
        bad: "Trust any job that pays well, because good jobs are rare and you must act fast.",
        why: "The second answer is dangerous advice.",
      },
      {
        q: "Give two tips for writing a short proposal.",
        good: "Be specific about your experience. Ask the client one clear question about the task.",
        bad: "Write as much as possible. Long proposals always win because they show effort.",
        why: "“Always win” is false, and length alone is not a skill.",
      },
    ],
  },
];

const GUIDE = [
  "<mark class='pos'>Positive</mark> The writer is happy, satisfied or praising.",
  "<mark class='neg'>Negative</mark> The writer is unhappy, frustrated or criticising.",
  "<mark class='neu'>Neutral</mark> Facts with no feeling, or good and bad points of equal strength.",
  "Sarcasm: label what the writer means.",
  "Use only what is written. Do not guess.",
];

/* ---------- App ---------- */
const app = document.getElementById("app");

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

const shuffle = (items) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

let name = "";
let filter = "all";
let send = null;
let rows = [];
let summary = "";
const proposalProgress = {};

const find = (id) => JOBS.find((job) => job.id === id);
const kind = { bid: "Bidding", qual: "Qualification", pool: "Task pool" };

async function initFirebase() {
  if (!FIREBASE_CONFIG.projectId) return;

  try {
    const [firebaseApp, firestore] = await Promise.all([
      import(FB + "firebase-app.js"),
      import(FB + "firebase-firestore.js"),
    ]);

    const db = firestore.getFirestore(firebaseApp.initializeApp(FIREBASE_CONFIG));
    send = (data) =>
      firestore.addDoc(firestore.collection(db, "submissions"), {
        ...data,
        createdAt: firestore.serverTimestamp(),
      });
  } catch (error) {
    send = null;
  }

  if (name) board();
}

async function save(data) {
  if (!send) return "demo";

  try {
    await send({ name, ...data });
    return "saved";
  } catch (error) {
    return "failed";
  }
}

const statusText = (status) => {
  if (status === "saved") return "Sent. Your facilitator can see it.";
  if (status === "demo") return "Demo mode: nothing was saved. Use Copy to share your work.";
  return "Sending failed. Check the internet, then use Copy to share your work.";
};

const draw = (html) => {
  app.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "auto" });
};

function gate() {
  draw(`
    <h1>Annotation work hub</h1>
    <p class="mu">Find a job, send a proposal or pass a test. Practice only. No real clients.</p>
    <div class="panel">
      <label class="f" for="nm">Your full name</label>
      <input id="nm" type="text" autocomplete="off" placeholder="Write your name as in class">
      <p><button class="pr" data-act="enter">Enter the hub</button></p>
    </div>
  `);
}

function board() {
  const list = JOBS.filter((job) => filter === "all" || job.type === filter);

  draw(`
    <div class="bar">
      <h1>Open jobs</h1>
      <span class="mu">${esc(name)} <button class="gh" data-act="rename">Change name</button></span>
    </div>
    <p class="mu">New to this? <a href="practice.html" target="_blank" rel="noopener">Practise with timed drills</a> before you take a test.</p>
    <div class="tabs">
      ${[
        ["all", "All jobs"],
        ["bid", "Bidding"],
        ["qual", "Qualification"],
        ["pool", "Task pool"],
      ]
        .map(
          ([value, label]) =>
            `<button class="tab" data-act="filter" data-id="${value}" aria-pressed="${filter === value}">${label}</button>`
        )
        .join("")}
    </div>
    ${list
      .map(
        (job) => `
          <div class="card">
            <div>
              <h2>${esc(job.title)}</h2>
              ${job.client ? `<p class="mu">Client: ${esc(job.client)}</p>` : ""}
              <p>${esc(job.short)}</p>
              <div class="meta">
                <span class="mu">Availability<b>${esc(job.seats)}</b></span>
                <span class="mu">Expected capacity<b>${esc(job.cap)}</b></span>
                <span class="mu">Style<b>${kind[job.type]}</b></span>
              </div>
            </div>
            <div class="side">
              <div class="pay">${esc(job.pay)}</div>
              ${job.type === "qual" ? '<span class="step">1 step to qualify</span>' : ""}
              ${job.type === "bid" && proposalProgress[job.id] && proposalProgress[job.id].accepted ? '<span class="step">Proposal accepted</span>' : ""}
              <button class="${job.type === "pool" ? "pr" : "gh"}" data-act="open" data-id="${job.id}">
                ${job.type === "bid" ? proposalProgress[job.id] && proposalProgress[job.id].accepted ? "View accepted offer" : "View and bid" : job.type === "qual" ? "View details" : "Start"}
              </button>
            </div>
          </div>
        `
      )
      .join("")}
  `);
}

function openJob(id) {
  const job = find(id);
  if (!job) return board();

  if (job.type === "bid") {
    if (proposalProgress[id] && proposalProgress[id].accepted) return offerJob(job);
    draw(`
      <button class="gh" data-act="back">Back to jobs</button>
      <h1>${esc(job.title)}</h1>
      <p class="mu">Client: ${esc(job.client)}. ${esc(job.pay)}. ${esc(job.seats)}.</p>
      <div class="panel"><h2>Project preview</h2><p>${esc(job.short)}</p><p class="mu">The full brief and project guidelines are shared after a client accepts your proposal.</p></div>
      <label class="f" for="tool">Tool you will use</label>
      <select id="tool">
        <option>Labelbox</option>
        <option>CVAT</option>
        <option>Spreadsheet</option>
      </select>
      <label class="f" for="pp">Your proposal</label>
      <textarea id="pp" placeholder="Say why you fit, when you can work, how you keep your work accurate, and ask the client one question."></textarea>
      <p class="mu">Aim for 40 to 150 words. Be specific.</p>
      <p>
        <button class="pr" data-act="bid" data-id="${job.id}">Send proposal</button>
        <button class="gh" data-act="report" data-id="${job.id}">Report this job as a scam</button>
      </p>
    `);
    return;
  }

  openAssessment(job);
}

function offerJob(job) {
  const progress = proposalProgress[job.id];
  draw(`
    <button class="gh" data-act="back">Back to jobs</button>
    <h1>Client accepted your proposal</h1>
    <p class="mu">Simulated offer · no real client or email is involved.</p>
    <div class="panel">
      <h2>In-app notification</h2>
      <p><b>From:</b> ${esc(job.client)}</p>
      <p><b>Subject:</b> Your proposal was accepted: ${esc(job.title)}</p>
      <p>Hello ${esc(name)}, your proposal was accepted. ${progress.qualified ? "Your qualification is complete. The full project brief is now available." : "Complete the qualification test to unlock the full project brief."}</p>
      <p class="mu">Email preview only — nothing was sent to an email address.</p>
    </div>
    ${
      progress.qualified
        ? `<div class="panel">
            <h2>Full job description</h2>
            <p>${esc(job.detail)}</p>
            <h2>Labeling guidelines</h2>
            <ul>${GUIDE.map((rule) => `<li>${rule}</li>`).join("")}</ul>
            <p><b>Deliverable:</b> Label 150 customer reviews as Positive, Negative or Neutral within one week. Flag unclear reviews instead of guessing.</p>
            <p><b>Tool:</b> ${esc(progress.tool)} · <b>Rate:</b> ${esc(job.pay)}</p>
            <p class="ok">Qualification passed. Your practice batch is unlocked.</p>
            <button class="pr" data-act="work" data-id="${job.id}">Start practice batch</button>
          </div>`
        : `<div class="panel"><h2>Next step: qualification</h2><p>Pass a short test on sentiment labels to unlock the complete job description and project guidelines.</p><p>Practice rules: label what is written, interpret sarcasm by its meaning, and do not guess.</p></div><p><button class="pr" data-act="qualify" data-id="${job.id}">Take qualification test</button></p>`
    }
  `);
}

function openAssessment(job) {
  const assessment = job.qualification || job;
  rows = assessment.items.map((item) => {
    if (item.a) {
      return {
        q: item.q,
        o: LABELS,
        c: LABELS.indexOf(item.a),
        why: item.why,
      };
    }

    const options = shuffle([
      [item.good, 1],
      [item.bad, 0],
    ]);

    return {
      q: item.q,
      o: options.map(([text]) => text),
      c: options.findIndex(([, isGood]) => isGood === 1),
      why: item.why,
      ab: 1,
    };
  });

  draw(`
    <button class="gh" data-act="back">Back to jobs</button>
    <h1>${esc(job.title)}</h1>
    <p class="mu">${esc(job.pay)}. ${esc(job.seats)}.</p>
    ${
    job.qualification || job.type === "qual"
      ? `<div class="panel"><h2>Project rules</h2><ul>${GUIDE.map((rule) => `<li>${rule}</li>`).join("")}</ul><p class="mu">Pass mark: ${assessment.pass} out of ${assessment.items.length}.</p><p>Not ready? <a href="practice.html" target="_blank" rel="noopener">Practise with timed drills first</a>.</p></div>`
        : "<p>Choose the better answer for each question.</p>"
    }
    ${rows
      .map(
        (row, index) => `
          <fieldset>
            <legend>${index + 1}. ${esc(row.q)}</legend>
            ${row.o
              .map(
                (option, optionIndex) => `
                  <label class="o">
                    <input type="radio" name="q${index}" value="${optionIndex}">
                    ${row.ab ? `Answer ${"AB"[optionIndex]}: ` : ""}${esc(option)}
                  </label>
                `
              )
              .join("")}
          </fieldset>
        `
      )
      .join("")}
    <p><button class="pr" data-act="quiz" data-id="${job.id}" ${job.qualification ? 'data-qualification="true"' : ""}>Submit answers</button></p>
  `);
}

async function quiz(id, qualification = false) {
  const job = find(id);
  if (!job) return board();

  const got = rows.map((_, index) => {
    const checked = document.querySelector(`input[name=q${index}]:checked`);
    return checked ? Number(checked.value) : -1;
  });

  if (got.includes(-1) && !confirm("Some questions have no answer and count as wrong. Submit anyway?")) {
    return;
  }

  const score = got.filter((answer, index) => answer === rows[index].c).length;
  const total = rows.length;
  const isQualification = qualification || job.type === "qual";
  const passed = isQualification ? score >= (job.qualification || job).pass : null;

  const result = await save({
    jobId: job.id,
    jobTitle: job.title,
    type: isQualification ? "qualification" : "task_pool",
    score,
    total,
    passed,
    answers: got,
  });

  summary = `Name: ${name}\nJob: ${job.title}\nScore: ${score}/${total}` + (passed === null ? "" : `\nQualified: ${passed ? "yes" : "no"}`);

  if (isQualification && job.qualification && passed) {
    proposalProgress[job.id].qualified = true;
  }

  const qualifiedForJob = isQualification && job.qualification;
  draw(`
    <h1>${score} out of ${total}</h1>
    <div class="panel">
      <p><b>${passed === null ? "Round complete." : passed ? qualifiedForJob ? "Qualification passed. The full job description is unlocked." : "You qualified. On a real platform, paid tasks would unlock now." : "Not qualified this time. Read the rules again and try once more."}</b></p>
      <p class="mu">${statusText(result)}</p>
      <p>
        <button class="gh" data-act="copy">Copy my results</button>
        ${passed === false ? `<button class="gh" data-act="${job.qualification ? "qualify" : "open"}" data-id="${job.id}">Try again</button>` : ""}
        ${qualifiedForJob && passed ? `<button class="pr" data-act="offer" data-id="${job.id}">View full job description</button>` : ""}
        <button class="pr" data-act="back">Back to jobs</button>
      </p>
    </div>
    ${rows
      .map(
        (row, index) => `
          <div class="panel">
            <p><b>${index + 1}. ${esc(row.q)}</b></p>
            <p>
              <span class="${got[index] === row.c ? "ok" : "no"}">
                ${got[index] === row.c ? "Correct" : "Not correct"}
              </span>
              Your choice: ${got[index] < 0 ? "none" : esc(row.o[got[index]])}
            </p>
            <p class="mu">Best: ${esc(row.o[row.c])}. ${esc(row.why)}</p>
          </div>
        `
      )
      .join("")}
  `);
}

function openWork(id) {
  const job = find(id);
  if (!job || !proposalProgress[id] || !proposalProgress[id].qualified) return board();

  draw(`
    <button class="gh" data-act="open" data-id="${id}">Back to job brief</button>
    <h1>Practice labeling batch</h1>
    <p class="mu">${esc(job.title)} · Sample task · No paid work is being assigned.</p>
    <div class="panel"><p>Label each review using the project guidelines. Use only what is written; do not guess.</p></div>
    ${job.workItems
      .map((item, index) => `
        <fieldset>
          <legend>${index + 1}. ${esc(item.q)}</legend>
          ${LABELS.map((label) => `<label class="o"><input type="radio" name="work${index}" value="${esc(label)}"> ${esc(label)}</label>`).join("")}
        </fieldset>
      `)
      .join("")}
    <p><button class="pr" data-act="submit-work" data-id="${id}">Submit practice batch</button></p>
  `);
}

async function submitWork(id) {
  const job = find(id);
  if (!job || !proposalProgress[id] || !proposalProgress[id].qualified) return board();

  const answers = job.workItems.map((_, index) => {
    const checked = document.querySelector(`input[name=work${index}]:checked`);
    return checked ? checked.value : "";
  });
  if (answers.includes("") && !confirm("Some labels are missing. Submit anyway?")) return;

  const score = answers.filter((answer, index) => answer === job.workItems[index].a).length;
  const result = await save({
    jobId: job.id,
    jobTitle: job.title,
    type: "practice_batch",
    score,
    total: job.workItems.length,
    answers,
  });
  summary = `Name: ${name}\nJob: ${job.title}\nPractice batch: ${score}/${job.workItems.length}`;

  draw(`
    <h1>Practice batch submitted</h1>
    <div class="panel"><p><b>${score} out of ${job.workItems.length} labels correct.</b></p>
      <p class="mu">${statusText(result)}</p>
      <button class="gh" data-act="copy">Copy my results</button>
      <button class="pr" data-act="open" data-id="${id}">Review the job brief</button>
    </div>
    ${job.workItems.map((item, index) => `
      <div class="panel"><p><b>${index + 1}. ${esc(item.q)}</b></p>
        <p>Your label: <span class="${answers[index] === item.a ? "ok" : "no"}">${answers[index] ? esc(answers[index]) : "Not answered"}</span></p>
        <p>Best label: <b>${esc(item.a)}</b>. ${esc(item.why)}</p>
      </div>
    `).join("")}
  `);
}

const checks = (text) => {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return [
    [wordCount >= 40 && wordCount <= 150, `Length is 40 to 150 words (yours: ${wordCount})`],
    [/\b\d+\s*(h|hr|hrs|hours?|days?|weeks?)\b|\bper (day|week)\b/i.test(text), "States when and how many hours you can work"],
    [/accura|careful|quality|double-check|re-check|second pass/i.test(text), "Says how you will keep your work accurate"],
    [/\?/.test(text), "Asks the client one clear question"],
    [/labelbox|cvat|spreadsheet|excel|sheet/i.test(text), "Names the tool you will use"],
  ];
};

async function bid(id) {
  const job = find(id);
  if (!job) return board();

  const text = document.getElementById("pp").value.trim();
  const tool = document.getElementById("tool").value;

  if (text.split(/\s+/).length < 10) {
    alert("Write at least a few sentences before you send.");
    return;
  }

  const result = await save({
    jobId: job.id,
    jobTitle: job.title,
    type: "proposal",
    tool,
    proposal: text,
    words: text.split(/\s+/).length,
  });

  if (job.scam) {
    proposalProgress[job.id] = { accepted: false, tool, qualified: false };
  } else {
    proposalProgress[job.id] = { accepted: true, tool, qualified: false };
  }

  summary = `Name: ${name}\nJob: ${job.title}\nTool: ${tool}\nProposal: ${text}`;

  draw(`
    <h1>Proposal sent</h1>
    <div class="panel">
      <p class="mu">${statusText(result)}</p>
      ${
        job.scam
          ? "<p><b>The simulated client did not accept this proposal.</b> Review the warning signs before deciding what to do next.</p>"
          : `<div class="panel"><h2>New in-app notification</h2><p><b>${esc(job.client)}</b> accepted your proposal for <b>${esc(job.title)}</b>.</p><p class="mu">Email notification preview only — nothing was sent.</p></div><p>This practice scenario advances you to the next stage so you can explore the workflow.</p>`
      }
      ${job.scam ? `<p class="no">Warning: this job was a scam. Real clients do not ask for fees or bank details.</p><ul>${job.flags.map((flag) => `<li>${esc(flag)}</li>`).join("")}</ul>` : ""}
      <h2>Quick check</h2>
      <p class="mu">A simple check, not a grade. A real client reads for specifics.</p>
      <ul>
        ${checks(text)
          .map(
            ([isValid, message]) =>
              `<li><span class="${isValid ? "ok" : "no"}">${isValid ? "Yes" : "Missing"}</span> ${esc(message)}</li>`
          )
          .join("")}
      </ul>
      <p>
        <button class="gh" data-act="copy">Copy my proposal</button>
        ${job.scam ? "" : `<button class="pr" data-act="offer" data-id="${job.id}">Open accepted offer</button>`}
        <button class="gh" data-act="back">Back to jobs</button>
      </p>
    </div>
  `);
}

async function report(id) {
  const job = find(id);
  if (!job) return board();

  const result = await save({
    jobId: job.id,
    jobTitle: job.title,
    type: "scam_report",
    reportedAsScam: true,
    wasScam: !!job.scam,
  });

  summary = `Name: ${name}\nReported: ${job.title}`;

  draw(`
    <h1>${job.scam ? "Good catch" : "This one looked legitimate"}</h1>
    <div class="panel">
      <p class="mu">${statusText(result)}</p>
      ${
        job.scam
          ? `<p>This was a scam post. The warning signs:</p><ul>${job.flags.map((flag) => `<li>${esc(flag)}</li>`).join("")}</ul>`
          : `<p>${esc(job.ok)} Reporting real jobs by mistake can cost you work, so look for specific warning signs first.</p>`
      }
      <p><button class="pr" data-act="back">Back to jobs</button></p>
    </div>
  `);
}


/* ---------- Practice onboarding: fake phone, identity and payment steps, plus a fake support bot ---------- */
const acct = { phone: false, id: false, pay: "" };
let pendingJob = null, idState = null, tickPhone = null, phoneNum = "", chatStarted = false;
const COUNTRIES = ["Uganda", "Democratic Republic of the Congo", "Kenya", "Rwanda", "Burundi", "South Sudan", "Tanzania", "Ethiopia", "Somalia", "Nigeria", "Ghana", "Other"];
const DOCS = ["Passport", "National ID card", "Driver’s licence", "Refugee ID or attestation", "Residence permit"];
const PAY = [
  { id: "PayPal", links: [["Open PayPal", "https://www.paypal.com/"]] },
  { id: "Payoneer", links: [["Open Payoneer", "https://www.payoneer.com/"]] },
  { id: "Mastercard or Visa card", links: [["Open Mastercard", "https://www.mastercard.com/"], ["Open Visa", "https://www.visa.com/"]] },
  { id: "Bank account", links: [], note: "Ask your bank which details it needs to receive payments from abroad." },
];
const BOT = [
  [/phone|code|sms|text message/i, "If the code does not arrive, check the number and country code, wait a minute, then ask for a new code. Still stuck? Tell us your country and phone network."],
  [/document|passport|identity|\bid\b|verif|country|refugee/i, "For document checks: use a clear photo of the whole document, in good light, not expired. Make sure the country you select matches the document. If it keeps failing, send us your country, the document type and the exact message you see."],
  [/pay|paypal|payoneer|card|bank|money|withdraw/i, "Check that your payment service works in your country and what it charges, before you create an account. Use the same name on your payment account and your identity document."],
  [/scam|fee|real|legit|trust/i, "Real platforms do not ask you to pay to start work or to share bank details in chat. Stay on the official platform and report anything that asks for money."],
  [/^\s*(hi|hello|hey)\b/i, "Hello! Tell us what is not working and we will help."],
];
const FALLBACK = "Thank you. We have created a support ticket. To help us, include: your country, the document or payment type, what you did, and the exact message you saw. A specialist replies within 1 to 2 working days. (Practice bot: no real agent will reply.)";

const modal = (html) => {
  let m = document.getElementById("modal");
  if (!m) { m = document.createElement("div"); m.id = "modal"; document.body.appendChild(m); }
  m.innerHTML = html ? `<div class="veil"><div class="dlg" role="dialog" aria-modal="true">${html}</div></div>` : "";
};
const toast = (text) => {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = text; document.body.appendChild(t);
  setTimeout(() => t.remove(), 6000);
};
const gid = (id) => document.getElementById(id);

function gateJob(id) {
  if (!find(id)) return board();
  if (acct.phone && acct.id && acct.pay) return openJob(id);
  pendingJob = id;
  if (!acct.phone) phoneStep(1); else setup();
}

function phoneStep(n) {
  clearInterval(tickPhone);
  if (n === 1) {
    return modal(`<h2>Verify your phone to continue</h2><p class="mu">Practice mode: type any fake number, for example +256 700 000000. No message is sent.</p>
      <label class="f" for="ph">Phone number</label><input id="ph" type="text" inputmode="tel" value="+256 " autocomplete="off">
      <p><button class="pr" data-x="psend">Send code</button> <button class="gh" data-x="mclose">Cancel</button></p>`);
  }
  let left = 30;
  modal(`<h2>Enter the 6-digit code</h2><p class="mu">A code was “sent” to ${esc(phoneNum)}. Practice mode: type any 6 digits, for example 123456.</p>
    <input id="cd" type="text" inputmode="numeric" maxlength="6" autocomplete="off"><p class="mu" id="cdt"></p>
    <p><button class="pr" data-x="pverify">Verify</button> <button class="gh" id="pnew" data-x="pnew" disabled>Send a new code</button></p>`);
  const tick = () => {
    const el = gid("cdt");
    if (!el) return clearInterval(tickPhone);
    el.textContent = left > 0 ? `You can ask for a new code in 0:${String(left).padStart(2, "0")}` : "Did not get a code? Ask for a new one.";
    if (left <= 0) { gid("pnew").disabled = false; clearInterval(tickPhone); }
    left -= 1;
  };
  tick(); tickPhone = setInterval(tick, 1000);
}

function setup() {
  const st = (ok) => `<span class="${ok ? "ok" : "mu"}">${ok ? "Done" : "To do"}</span>`;
  const ready = acct.phone && acct.id && acct.pay;
  draw(`<button class="gh" data-act="back">Back to jobs</button><h1>Set up your account</h1>
    <p class="mu">Practice mode. Real platforms ask for similar steps before you can work.</p>
    <div class="panel">
      <p>${st(acct.phone)} <b>Phone verified</b> ${acct.phone ? "" : '<button class="gh" data-x="phgo">Verify phone</button>'}</p>
      <p>${st(acct.id)} <b>Identity verified</b> ${acct.id ? "" : '<button class="gh" data-x="idgo">Start verification</button>'}</p>
      <p>${st(!!acct.pay)} <b>Payment method</b>${acct.pay ? " (" + esc(acct.pay) + ")" : ' <button class="gh" data-x="paygo">Choose method</button>'}</p>
    </div>
    ${ready ? '<p><button class="pr" data-x="jobgo">Continue to the job</button></p>' : '<p class="mu">Finish all three steps to unlock jobs.</p>'}`);
}

function idView() {
  const s = idState;
  const h = (title, body) => draw(`<button class="gh" data-act="back">Cancel</button><h1>Identity verification</h1>
    <p class="mu">Practice mode. Nothing is uploaded or saved.</p><div class="panel"><h2>${title}</h2>${body}</div>`);
  if (s.s === 1) return h("Terms and conditions", `<p>Practice terms: you agree to give correct information, to use only your own documents on real platforms, and that documents can be rejected if they are blurry, cut off or expired.</p>
    <label class="o"><input type="checkbox" id="tc"> I accept the terms and conditions</label><p><button class="pr" data-x="idnext">Continue</button></p>`);
  if (s.s === 2) return h("Country and document", `<label class="f" for="ct">Country of residence</label>
    <select id="ct">${COUNTRIES.map((c) => `<option${c === s.country ? " selected" : ""}>${c}</option>`).join("")}</select>
    <label class="f">Document type</label>${DOCS.map((d) => `<label class="o"><input type="radio" name="dt" value="${d}"${d === s.doc ? " checked" : ""}> ${d}</label>`).join("")}
    <p class="mu">Accepted documents differ by platform and country. On a real platform, read its list first.</p><p><button class="pr" data-x="idnext">Continue</button></p>`);
  if (s.s === 3 || s.s === 4) {
    const side = s.s === 3 ? "front" : "back";
    return h(`Upload the ${side} of your document`, `<p class="no">Do not upload your real document on this practice site. Use the sample.</p>
      <p><button class="pr" data-x="idsample">Use a sample document</button></p>
      <label class="f" for="fl">Or choose any harmless image</label><input id="fl" type="file" accept="image/*" capture="environment">
      <p><button class="gh" data-x="idfile">Use this image</button></p><p class="mu">${s[side] || "No image yet"}</p>
      ${s[side] ? '<p><button class="pr" data-x="idnext">Continue</button></p>' : ""}`);
  }
  if (s.s === 5) return h("Checking your document", "<p>Please wait. On real platforms this can take minutes or hours.</p>");
  h("Document approved", '<p class="ok">Your document was approved. You can start working.</p><p><button class="pr" data-x="idfin">Continue</button></p>');
}

function payView(m) {
  const p = PAY.find((x) => x.id === m);
  draw(`<button class="gh" data-act="back">Cancel</button><h1>Payment method</h1>
    <p class="mu">Practice mode. Never type real card numbers, passwords or bank details here.</p>
    <div class="panel">${PAY.map((x) => `<button class="${x.id === m ? "pr" : "gh"}" data-x="paypick" data-m="${x.id}">${x.id}</button>`).join(" ")}</div>
    ${p ? `<div class="panel"><h2>${p.id}</h2>
      <p class="mu">Check that this works in your country and what it charges before you create an account.</p>
      ${p.note ? `<p>${p.note}</p>` : ""}
      <p>${p.links.map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`).join(" · ")}</p>
      <label class="f" for="pe">Fake email or label for this method</label><input id="pe" type="text" placeholder="name@example.com" autocomplete="off">
      <p><button class="pr" data-x="paylink" data-m="${p.id}">Link payment method</button></p></div>` : ""}`);
}

/* Fake support chat: simple keyword rules, no real AI and no real agent */
function chatInit() {
  const c = document.createElement("div");
  c.id = "chat";
  c.innerHTML = `<button class="pr chatbtn" data-x="chat">Support</button>
    <div class="chatbox hidden" id="chatbox"><div class="chathead"><b>Support assistant</b><span class="mu"> practice bot</span></div>
    <div class="chatlog" id="chatlog" aria-live="polite"></div>
    <div class="chatq">${["Phone code not arriving", "Document verification problem", "Payment method problem", "Is this job real?"].map((q) => `<button class="tab" data-x="chatq" data-q="${q}">${q}</button>`).join("")}</div>
    <div class="chatin"><input id="chatin" type="text" placeholder="Type a message" autocomplete="off"><button class="pr" data-x="chatsend">Send</button></div></div>`;
  document.body.appendChild(c);
  gid("chatin").addEventListener("keydown", (e) => { if (e.key === "Enter") chatSend(); });
}
const chatAdd = (who, text) => {
  const log = gid("chatlog"), d = document.createElement("div");
  d.className = "msg " + who; d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight;
};
function chatSend(text) {
  const inp = gid("chatin"), t = (text || inp.value).trim();
  if (!t) return;
  inp.value = ""; chatAdd("me", t);
  const hit = BOT.find(([re]) => re.test(t));
  setTimeout(() => chatAdd("bot", hit ? hit[1] : FALLBACK), 700);
}
function chatToggle() {
  const box = gid("chatbox"); box.classList.toggle("hidden");
  if (!chatStarted) { chatStarted = true; chatAdd("bot", "Before we begin, please tell us anything that could help us get started. The more detail you give, the better we can help. (Practice bot: no real agent will reply.)"); }
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-x]");
  if (!b) return;
  const x = b.dataset.x, s = idState;
  if (x === "mclose") modal("");
  else if (x === "phgo") phoneStep(1);
  else if (x === "psend") {
    const v = gid("ph").value.trim();
    if (v.replace(/\D/g, "").length < 7) return alert("Enter a fake number with at least 7 digits.");
    phoneNum = v; phoneStep(2);
  } else if (x === "pnew") phoneStep(2);
  else if (x === "pverify") {
    if (!/^\d{6}$/.test(gid("cd").value.trim())) return alert("Enter 6 digits.");
    clearInterval(tickPhone); acct.phone = true; modal(""); setup();
  } else if (x === "idgo") { idState = { s: 1, country: "", doc: "", front: "", back: "" }; idView(); }
  else if (x === "idnext") {
    if (s.s === 1) { if (!gid("tc").checked) return alert("Accept the terms to continue."); s.s = 2; }
    else if (s.s === 2) {
      const d = document.querySelector("input[name=dt]:checked");
      if (!d) return alert("Choose a document type.");
      s.country = gid("ct").value; s.doc = d.value; s.s = 3;
    } else if (s.s === 3) s.s = s.doc === "Passport" ? 5 : 4;
    else if (s.s === 4) s.s = 5;
    idView();
    if (s.s === 5) setTimeout(() => {
      if (idState === s && s.s === 5) { s.s = 6; idView(); toast("Notification: your document was approved. You can start working."); }
    }, 6000);
  } else if (x === "idsample") { s[s.s === 3 ? "front" : "back"] = "Sample document selected"; idView(); }
  else if (x === "idfile") {
    if (!gid("fl").files[0]) return alert("Choose an image first.");
    s[s.s === 3 ? "front" : "back"] = "Image selected"; idView();
  } else if (x === "idfin") { acct.id = true; setup(); }
  else if (x === "paygo") payView();
  else if (x === "paypick") payView(b.dataset.m);
  else if (x === "paylink") {
    if (gid("pe").value.trim().length < 3) return alert("Type a fake email or label.");
    acct.pay = b.dataset.m; toast("Payment method linked (practice)."); setup();
  } else if (x === "jobgo") openJob(pendingJob);
  else if (x === "chat") chatToggle();
  else if (x === "chatq") chatSend(b.dataset.q);
  else if (x === "chatsend") chatSend();
});

app.addEventListener("click", (event) => {
  const button = event.target.closest("[data-act]");
  if (!button) return;

  const action = button.dataset.act;
  const id = button.dataset.id;

  if (action === "enter") {
    const value = document.getElementById("nm").value.trim();
    if (value.length < 2) {
      alert("Enter your full name.");
      return;
    }
    name = value;
    board();
    return;
  }

  if (action === "rename") {
    name = "";
    acct.phone = false; acct.id = false; acct.pay = "";
    Object.keys(proposalProgress).forEach((jobId) => delete proposalProgress[jobId]);
    gate();
    return;
  }

  if (action === "filter") {
    filter = id;
    board();
    return;
  }

  if (action === "back") {
    board();
    return;
  }

  if (action === "open") {
    gateJob(id);
    return;
  }

  if (action === "bid") {
    bid(id);
    return;
  }

  if (action === "report") {
    report(id);
    return;
  }

  if (action === "quiz") {
    quiz(id, button.dataset.qualification === "true");
    return;
  }

  if (action === "offer") {
    const job = find(id);
    if (job && proposalProgress[id] && proposalProgress[id].accepted) offerJob(job);
    return;
  }

  if (action === "qualify") {
    const job = find(id);
    if (!job || !job.qualification || !proposalProgress[id] || !proposalProgress[id].accepted) return board();
    openAssessment(job);
    return;
  }

  if (action === "work") {
    openWork(id);
    return;
  }

  if (action === "submit-work") {
    submitWork(id);
    return;
  }

  if (action === "copy") {
    const copyText = () => {
      button.textContent = "Copied";
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary).then(copyText, () => prompt("Copy this:", summary));
      return;
    }

    prompt("Copy this:", summary);
  }
});

app.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.id === "nm") {
    app.querySelector("[data-act=enter]").click();
  }
});

gate();
chatInit();
initFirebase();