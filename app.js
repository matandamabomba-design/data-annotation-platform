const BOT_NAME = "Ask Matanda";

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
    detail: "The client needs 150 short customer reviews labelled within one week. They want someone careful who follows a short rule sheet and flags unclear reviews instead of guessing. For this practice project, work in a spreadsheet or annotation tool that can export a CSV with task_id, review_text and label columns.",
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
      { id: "REV-001", q: "The delivery arrived early and everything was packed carefully.", a: "Positive", why: "The customer is pleased with the early, careful delivery." },
      { id: "REV-002", q: "I waited two weeks and nobody replied to my support request.", a: "Negative", why: "The customer is frustrated about the delay and lack of response." },
      { id: "REV-003", q: "The order contains three notebooks and a blue pen.", a: "Neutral", why: "This is a factual description without an opinion." },
      { id: "REV-004", q: "The jacket looks great, but the zip broke on the first day.", a: "Negative", why: "The explicit complaint about the zip outweighs the brief positive comment." },
      { id: "REV-005", q: "Perfect, another password reset that does not work.", a: "Negative", why: "The sarcasm expresses frustration with the reset." },
      { id: "REV-006", q: "My parcel was left at the front desk at noon.", a: "Neutral", why: "This reports what happened without evaluating it." },
      { id: "REV-007", q: "The support agent listened and fixed my account in minutes.", a: "Positive", why: "The customer praises the helpful and quick support." },
      { id: "REV-008", q: "The bottle holds 750 ml and has a screw-top lid.", a: "Neutral", why: "This is a factual product description." },
      { id: "REV-009", q: "I would happily order from this shop again.", a: "Positive", why: "The customer clearly expresses satisfaction and intent to return." },
      { id: "REV-010", q: "The headphones arrived with one side completely silent.", a: "Negative", why: "The customer describes a product fault." },
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
  document.body.classList.add("home-screen");
  document.body.classList.remove("board-screen");
}

function board() {
  const list = JOBS.filter((job) => filter === "all" || job.type === filter);

  draw(`
    <div class="board-hero">
      <div class="bar">
        <h1>Open jobs</h1>
        <span>${esc(name)} <button class="gh" data-act="rename">Change name</button></span>
      </div>
      <p>New to this? <a href="practice.html" target="_blank" rel="noopener">Practise with timed drills</a> before you take a test.</p>
    </div>
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
  document.body.classList.remove("home-screen");
  document.body.classList.add("board-screen");
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
            <p><b>Issued:</b> ${esc(formatDate(progress.issuedAt))}</p>
            <p><b>Deadline:</b> ${esc(formatDeadline(progress.deadline))} (Africa/Kampala, EAT / UTC+3)</p>
            <h2>Labeling guidelines</h2>
            <ul>${GUIDE.map((rule) => `<li>${rule}</li>`).join("")}</ul>
            <p><b>Full project deliverable:</b> 150 reviews labelled within one week. This practice pack contains a 10-review sample batch.</p>
            <p><b>Practice export:</b> CSV with headers <code>task_id,review_text,label</code>. Keep each task ID and review text unchanged, and use only Positive, Negative or Neutral.</p>
            <p><b>Where to submit:</b> Upload the completed CSV in this practice hub under “Submit your CSV export”. Real projects specify their own submission portal or workspace.</p>
            <p><b>Tool:</b> ${esc(progress.tool)} · <b>Rate shown in listing:</b> ${esc(job.pay)} (illustrative only; no payment is offered)</p>
            <p class="mu">Use the downloads below as your handoff pack. You can annotate the CSV in a spreadsheet or import it into a compatible tool, then export it back to this CSV format. Other platform-specific export formats are not accepted here.</p>
            <p>
              <button class="gh" data-act="download-brief" data-id="${job.id}">Download project brief</button>
              <button class="gh" data-act="download-template" data-id="${job.id}">Download CSV template</button>
            </p>
            <p class="ok">Qualification passed. Your practice batch is unlocked.</p>
            <button class="pr" data-act="work" data-id="${job.id}">Open sample batch and submission</button>
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

function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function projectCsv(job) {
  return [
    ["task_id", "review_text", "label"],
    ...job.workItems.map((item) => [item.id, item.q, ""]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

function downloadFile(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "Africa/Kampala",
  }).format(date);

const formatDeadline = (date) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Kampala",
  }).format(date);

function createDeadline(issuedAt) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Africa/Kampala",
    })
      .formatToParts(issuedAt)
      .map(({ type, value }) => [type, value])
  );
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + 7, 14));
}

function projectBrief(job, progress) {
  return [
    "PRACTICE PROJECT BRIEF — SIMULATED WORK, NO PAYMENT",
    "",
    `Project: ${job.title}`,
    `Client: ${job.client} (fictional practice client)`,
    `Issued: ${formatDate(progress.issuedAt)} (Africa/Kampala)`,
    `Deadline: ${formatDeadline(progress.deadline)} (Africa/Kampala, EAT / UTC+3)`,
    "",
    "JOB DESCRIPTION",
    job.detail,
    "",
    "FULL PROJECT SCOPE",
    "A real project would contain 150 reviews. This training pack contains a 10-review sample batch only.",
    "",
    "LABELING GUIDELINES",
    "Positive — The writer is happy, satisfied or praising.",
    "Negative — The writer is unhappy, frustrated or criticising.",
    "Neutral — Facts with no feeling, or good and bad points of equal strength.",
    "Interpret sarcasm by what the writer means. Use only the text; do not guess.",
    "If a real project has an unclear item, follow its escalation instructions instead of guessing.",
    "",
    "TOOL AND WORKFLOW",
    `Selected tool: ${progress.tool}. Use a spreadsheet or a compatible annotation tool that can import the template and export CSV. Each tool may have a different native export; this hub accepts the CSV schema below only.`,
    "",
    "DELIVERABLE AND EXPORT FORMAT",
    "Submit one UTF-8 CSV file with these required column headers: task_id,review_text,label. Additional columns are allowed.",
    "Keep task_id and review_text unchanged. Fill label with exactly one of: Positive, Negative, Neutral.",
    "Include all 10 sample rows once each. Do not add a score or change the row IDs.",
    "",
    "SUBMISSION LOCATION",
    "Upload the finished CSV in the practice hub using “Submit completed CSV”. No email is sent.",
    "This simulated task is for practice only. It is not a real client assignment and has no payment.",
  ].join("\n");
}

function openWork(id) {
  const job = find(id);
  if (!job || !proposalProgress[id] || !proposalProgress[id].qualified) return board();
  const submission = proposalProgress[id].submission;

  if (submission && submission.qa && submission.qa.accepted) {
    return showPaymentRecord(job, proposalProgress[id]);
  }

  if (submission && !submission.qa) {
    return showSubmissionReceipt(job, proposalProgress[id]);
  }

  draw(`
    <button class="gh" data-act="offer" data-id="${id}">Back to project handoff</button>
    <h1>Sample batch: review sentiment</h1>
    <p class="mu">${esc(job.title)} · ${job.workItems.length} sample records · practice only</p>
    <div class="panel">
      <h2>Before you start</h2>
      <ol>
        <li>Download the CSV template from the project handoff.</li>
        <li>Label every row in your chosen compatible tool. Preserve the task IDs and review text.</li>
        <li>Export as UTF-8 CSV with <code>task_id</code>, <code>review_text</code> and <code>label</code> columns.</li>
        <li>Upload the completed CSV below. The hub checks its structure and gives practice feedback.</li>
      </ol>
      <p class="mu">Submission deadline: ${esc(formatDeadline(proposalProgress[id].deadline))} (EAT / UTC+3). This is a simulated deadline.</p>
    </div>
    <div class="panel">
      <h2>Submit your CSV export</h2>
      <label class="f" for="export-file">Completed CSV file</label>
      <input id="export-file" type="file" accept=".csv,text/csv">
      <p id="submission-status" class="mu" role="status" aria-live="polite">Required headers: task_id, review_text, label. All ${job.workItems.length} task IDs must be included once. This will begin a simulated client review; feedback is shown after QA.</p>
      <p><button class="pr" data-act="submit-export" data-id="${id}">${submission ? "Submit revised CSV" : "Submit completed CSV"}</button></p>
    </div>
  `);
}

function showSubmissionReceipt(job, progress) {
  const submission = progress.submission;
  draw(`
    <h1>Submission received</h1>
    <p class="mu">Practice submission · no real client received this file.</p>
    <div class="panel">
      <p><b>Project:</b> ${esc(job.title)}</p>
      <p><b>Submission:</b> ${submission.attempt} ${submission.attempt === 1 ? "st" : submission.attempt === 2 ? "nd" : submission.attempt === 3 ? "rd" : "th"} attempt</p>
      <p><b>Received:</b> ${esc(formatDeadline(submission.submittedAt))} (EAT / UTC+3)</p>
      <p><b>Status:</b> Awaiting quality review</p>
      <p class="mu">${statusText(submission.saveResult)} The training answer key is hidden until the simulated QA review.</p>
      <button class="pr" data-act="review-qa" data-id="${job.id}">Continue to quality review</button>
      <button class="gh" data-act="offer" data-id="${job.id}">Review project brief</button>
      <button class="gh" data-act="back">Back to jobs</button>
    </div>
  `);
}

async function reviewSubmission(id) {
  const job = find(id);
  const progress = proposalProgress[id];
  const submission = progress && progress.submission;
  if (!job || !submission || submission.qa) {
    if (job && submission && submission.qa && submission.qa.accepted) showPaymentRecord(job, progress);
    else if (job && submission) showQaResult(job, progress);
    else board();
    return;
  }

  const accepted = submission.score >= Math.ceil(job.workItems.length * 0.8);
  const reviewedAt = new Date();
  const result = await save({
    jobId: job.id,
    jobTitle: job.title,
    type: "practice_qa",
    attempt: submission.attempt,
    score: submission.score,
    total: job.workItems.length,
    accepted,
  });
  submission.qa = { accepted, reviewedAt, saveResult: result };

  if (accepted) {
    const paymentResult = await save({
      jobId: job.id,
      jobTitle: job.title,
      type: "practice_payment",
      status: "approved_for_simulated_payout",
      amount: null,
      currency: null,
      reason: "The sample batch has no billable hours or configured piece rate.",
    });
    submission.payment = { status: "approved", saveResult: paymentResult };
  }

  showQaResult(job, progress);
}

function showQaResult(job, progress) {
  const submission = progress.submission;
  const { accepted, reviewedAt, saveResult } = submission.qa;
  draw(`
    <h1>${accepted ? "Work accepted" : "Corrections requested"}</h1>
    <p class="mu">Simulated quality review · attempt ${submission.attempt} · ${esc(formatDeadline(reviewedAt))} EAT / UTC+3</p>
    <div class="panel">
      <p><b>Quality score:</b> ${submission.score} out of ${job.workItems.length} (${Math.round((submission.score / job.workItems.length) * 100)}%)</p>
      <p><b>Decision:</b> ${accepted ? "Accepted — the practice batch meets the 80% accuracy threshold." : "Revision requested — correct the flagged labels and submit an updated CSV."}</p>
      <p class="mu">${statusText(saveResult)} This decision and answer key are simulated for training.</p>
      ${
        accepted
          ? `<p>In a real workflow, accepted work becomes eligible for payment under the project’s agreed rate and payout schedule. Continue to the practice payment record to see what is and is not calculated here.</p>
            <button class="pr" data-act="payment" data-id="${job.id}">View payment record</button>`
          : `<p>Quality feedback is shown below. A real client may specify whether corrections are allowed and how quickly they are due.</p>
            <button class="pr" data-act="work" data-id="${job.id}">Upload corrected CSV</button>`
      }
    </div>
    ${submission.feedback.map((item, index) => `
      <div class="panel"><p><b>${index + 1}. ${esc(item.id)} — ${esc(item.text)}</b></p>
        <p>Your label: <span class="${item.submitted === item.correct ? "ok" : "no"}">${esc(item.submitted)}</span></p>
        <p>Reference label: <b>${esc(item.correct)}</b>. ${esc(item.why)}</p>
      </div>
    `).join("")}
  `);
}

function showPaymentRecord(job, progress) {
  const submission = progress.submission;
  const payment = submission.payment;
  draw(`
    <h1>Payment record</h1>
    <p class="mu">Simulated payment stage · no money is transferred.</p>
    <div class="panel">
      <h2>Earnings approval</h2>
      <p><b>Project:</b> ${esc(job.title)}</p>
      <p><b>Quality status:</b> Accepted (${submission.score}/${job.workItems.length})</p>
      <p><b>Payment status:</b> Approved for payout simulation</p>
      <p><b>Amount:</b> Not calculated — this sample has no billable hours or configured per-task rate.</p>
      <p><b>Rate in listing:</b> ${esc(job.pay)} (illustrative; the sample is unpaid)</p>
      <p class="mu">${statusText(payment.saveResult)}</p>
    </div>
    <div class="panel">
      <h2>What happens on a real platform?</h2>
      <ol>
        <li>The platform records approved earnings against the agreed rate or accepted task count.</li>
        <li>Funds are released according to the contract and the platform’s payout schedule.</li>
        <li>The worker checks the available balance, fees and payout method, then requests withdrawal if required.</li>
      </ol>
      <p class="no">This demo does not hold funds, connect to a payment provider, or send a payout.</p>
      <button class="gh" data-act="offer" data-id="${job.id}">Back to project brief</button>
    </div>
  `);
}

function parseCsv(text) {
  const records = [];
  let row = [];
  let field = "";
  let quoted = false;
  let quoteClosed = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
        quoteClosed = true;
      } else {
        field += char;
      }
      continue;
    }

    if (quoteClosed && char !== "," && char !== "\r" && char !== "\n") {
      throw new Error("A quoted CSV field has unexpected characters after its closing quote.");
    }
    if (char === '"') {
      if (field) throw new Error("A quote appeared inside an unquoted CSV field.");
      quoted = true;
      quoteClosed = false;
    } else if (char === ",") {
      row.push(field);
      field = "";
      quoteClosed = false;
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell !== "")) records.push(row);
      row = [];
      field = "";
      quoteClosed = false;
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error("A quoted CSV field was not closed.");
  row.push(field);
  if (row.some((cell) => cell !== "")) records.push(row);
  return records;
}

function validateProjectExport(job, csvText) {
  const records = parseCsv(csvText.replace(/^\uFEFF/, ""));
  if (records.length < 2) throw new Error("The CSV must include a header and all labeled task rows.");

  const headers = records[0].map((header) => header.trim().toLowerCase());
  const required = ["task_id", "review_text", "label"];
  const columns = Object.fromEntries(required.map((header) => [header, headers.indexOf(header)]));
  const missingHeaders = required.filter((header) => columns[header] < 0);
  if (missingHeaders.length) throw new Error(`Missing required column${missingHeaders.length > 1 ? "s" : ""}: ${missingHeaders.join(", ")}.`);
  if (required.some((header) => headers.lastIndexOf(header) !== columns[header])) {
    throw new Error("Required CSV column names must appear only once.");
  }

  const expected = new Map(job.workItems.map((item) => [item.id, item]));
  const submitted = new Map();
  for (const [index, values] of records.slice(1).entries()) {
    if (values.length !== headers.length) throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${headers.length}.`);
    const taskId = values[columns.task_id].trim();
    if (!expected.has(taskId)) throw new Error(`Unknown task ID "${taskId}" on CSV row ${index + 2}.`);
    if (submitted.has(taskId)) throw new Error(`Task ID "${taskId}" appears more than once.`);
    const item = expected.get(taskId);
    if (values[columns.review_text] !== item.q) throw new Error(`Review text for ${taskId} was changed. Keep source text unchanged.`);
    const label = values[columns.label].trim();
    if (!LABELS.includes(label)) throw new Error(`Invalid or missing label for ${taskId}. Use exactly: ${LABELS.join(", ")}.`);
    submitted.set(taskId, label);
  }

  const missing = [...expected.keys()].filter((taskId) => !submitted.has(taskId));
  if (missing.length) throw new Error(`Missing ${missing.length} task row${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`);

  const feedback = job.workItems.map((item) => ({
    id: item.id,
    text: item.q,
    submitted: submitted.get(item.id),
    correct: item.a,
    why: item.why,
  }));
  return { score: feedback.filter((item) => item.submitted === item.correct).length, feedback };
}

async function submitExport(id) {
  const job = find(id);
  if (!job || !proposalProgress[id] || !proposalProgress[id].qualified) return board();
  const file = document.getElementById("export-file").files[0];
  const status = document.getElementById("submission-status");
  if (!file) {
    status.textContent = "Choose your completed CSV export before submitting.";
    status.className = "no";
    return;
  }
  if (file.size > 1024 * 1024) {
    status.textContent = "This sample export is larger than 1 MB. Check that you selected the project CSV, not a full dataset.";
    status.className = "no";
    return;
  }
  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
    status.textContent = "This project accepts CSV files only. Export your annotations as .csv and try again.";
    status.className = "no";
    return;
  }

  let checked;
  try {
    checked = validateProjectExport(job, await file.text());
  } catch (error) {
    status.textContent = `Submission not accepted: ${error instanceof Error ? error.message : "The selected CSV could not be read."}`;
    status.className = "no";
    return;
  }

  const { score, feedback } = checked;
  const result = await save({
    jobId: job.id,
    jobTitle: job.title,
    type: "practice_export",
    score,
    total: job.workItems.length,
    answers: feedback.map((item) => item.submitted),
  });
  const progress = proposalProgress[id];
  const attempt = progress.submission ? progress.submission.attempt + 1 : 1;
  progress.submission = {
    score,
    feedback,
    saveResult: result,
    attempt,
    submittedAt: new Date(),
    qa: null,
    payment: null,
  };
  summary = `Name: ${name}\nJob: ${job.title}\nSubmission received: attempt ${attempt}\nStatus: awaiting simulated quality review`;
  showSubmissionReceipt(job, progress);
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

  const issuedAt = new Date();
  proposalProgress[job.id] = {
    accepted: !job.scam,
    tool,
    qualified: false,
    issuedAt,
    deadline: createDeadline(issuedAt),
  };

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


/* ---------- Practice onboarding: simulated phone, identity, payment, and chat steps ---------- */
const acct = { phone: false, id: false, pay: "" };
let pendingJob = null, idState = null, tickPhone = null, phoneNum = "", chatStarted = false;
const COUNTRIES = ["Uganda", "Democratic Republic of the Congo", "Kenya", "Rwanda", "Burundi", "South Sudan", "Tanzania", "Ethiopia", "Somalia", "Nigeria", "Ghana", "Other"];
const DOCS = ["Passport", "National ID card", "Driver’s licence", "Refugee ID or attestation", "Residence permit"];
const PAY = [
  { id: "PayPal", icon: "paypal.svg", links: [["Open PayPal", "https://www.paypal.com/"]] },
  { id: "Payoneer", icon: "payoneer.svg", links: [["Open Payoneer", "https://www.payoneer.com/"]] },
  { id: "Mastercard or Visa card", icon: "cards.svg", links: [["Open Mastercard", "https://www.mastercard.com/"], ["Open Visa", "https://www.visa.com/"]] },
  { id: "Bank account", icon: "bank.svg", links: [], note: "Ask your bank which details it needs to receive payments from abroad." },
];
const BOT = [
  [/phone|code|sms|text message/i, "If the code does not arrive, check the number and country code, wait a minute, then ask for a new code. Still stuck? Tell us your country and phone network."],
  [/document|passport|identity|\bid\b|verif|country|refugee/i, "For document checks: use a clear photo of the whole document, in good light, not expired. Make sure the country you select matches the document. If it keeps failing, send us your country, the document type and the exact message you see."],
  [/pay|paypal|payoneer|card|bank|money|withdraw/i, "Check that your payment service works in your country and what it charges, before you create an account. Use the same name on your payment account and your identity document."],
  [/scam|fee|real|legit|trust/i, "Real platforms do not ask you to pay to start work or to share bank details in chat. Stay on the official platform and report anything that asks for money."],
  [/^\s*(hi|hello|hey)\b/i, "Hello! Tell us what is not working and we will help."],
];
const FALLBACK = "This is an automatic practice reply, not a support ticket. For useful practice feedback, include your country, the document or payment type, what you did and the exact message you saw. No real specialist will reply.";

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
      <label class="f" for="fl">Or choose any harmless image (maximum 5 MB)</label><input id="fl" type="file" accept="image/*" capture="environment">
      <p class="mu" id="id-status" aria-live="polite">${s[side] || "No image selected"}</p>
      <p><button class="pr${s[side] ? "" : " hidden"}" id="id-continue" data-x="idnext">Continue</button></p>`);
  }
  if (s.s === 5) return h("Checking your document", "<p>Please wait. On real platforms this can take minutes or hours.</p>");
  h("Document approved", '<p class="ok">Your document was approved. You can start working.</p><p><button class="pr" data-x="idfin">Continue</button></p>');
}

function payView(m) {
  const p = PAY.find((x) => x.id === m);
  draw(`<button class="gh" data-act="back">Cancel</button><h1>Payment method</h1>
    <p class="mu">Practice mode. Never type real passwords or payment details here.</p>
    <div class="payment-options" role="group" aria-label="Choose a payment method">${PAY.map((x) => `<button type="button" class="gh payment-option" data-x="paypick" data-m="${x.id}" aria-pressed="${x.id === m}"><img class="payment-icon" src="assets/payments/${x.icon}" alt="${esc(x.id)} logo"><span>${esc(x.id)}</span></button>`).join("")}</div>
    ${p ? `<div class="panel"><h2>${esc(p.id)}</h2>
      <p class="mu">Check that this works in your country and what it charges before you create an account.</p>
      ${p.note ? `<p>${p.note}</p>` : ""}
      <p>${p.links.map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`).join(" · ")}</p>
      ${p.id === "PayPal" || p.id === "Payoneer" ? `
        <label class="f" for="pe">Fake email for this practice method</label><input id="pe" type="email" placeholder="name@example.com" autocomplete="off">
      ` : p.id === "Mastercard or Visa card" ? `
        <p class="payment-notice">Practice only. Never type your real card or bank details.</p>
        <div class="payment-fields">
          <div class="wide"><label class="f" for="cardholder">Cardholder name</label><input id="cardholder" type="text" autocomplete="off"></div>
          <div class="wide"><label class="f" for="cardnumber">Card number</label><input id="cardnumber" type="text" inputmode="numeric" autocomplete="off" maxlength="19" aria-describedby="card-detected"><span class="brand-detection" id="card-detected"><img id="card-logo" alt="" hidden><span id="card-brand" aria-live="polite">Enter a sample card number</span></span></div>
          <div><label class="f" for="cardexpiry">Expiry (MM/YY)</label><input id="cardexpiry" type="text" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="MM/YY"></div>
          <div><label class="f" for="cardcvc">CVC</label><input id="cardcvc" type="text" inputmode="numeric" autocomplete="off" maxlength="3"></div>
        </div>
        <button type="button" class="gh" data-x="paysample">Fill with sample details</button>
      ` : `
        <p class="payment-notice">Practice only. Never type your real card or bank details.</p>
        <div class="payment-fields">
          <div><label class="f" for="bankname">Bank name</label><input id="bankname" type="text" autocomplete="off"></div>
          <div><label class="f" for="accountholder">Account holder name</label><input id="accountholder" type="text" autocomplete="off"></div>
          <div><label class="f" for="accountnumber">Account number</label><input id="accountnumber" type="text" inputmode="numeric" autocomplete="off" maxlength="10"></div>
          <div><label class="f" for="swift">SWIFT/BIC code</label><input id="swift" type="text" autocomplete="off"></div>
        </div>
        <button type="button" class="gh" data-x="paysample">Fill with sample details</button>
      `}
      <p class="no hidden" id="pay-error" role="alert">For your safety, this practice site only accepts sample numbers.</p>
      <p><button class="pr" data-x="paylink" data-m="${p.id}">Link payment method</button></p></div>` : ""}`);
}

/* Practice chat uses the existing keyword rules and never contacts a real agent. */
function chatInit() {
  const c = document.createElement("div");
  c.id = "chat";
  c.innerHTML = `<button class="pr chatbtn" id="chat-launcher" data-x="chat" aria-label="${BOT_NAME} chat" aria-expanded="false">${BOT_NAME}<span class="chat-unread hidden" id="chat-unread" aria-label="Unread reply"></span></button>
    <div class="chatbox hidden" id="chatbox"><div class="chathead"><span class="chat-avatar" aria-hidden="true">M</span><b class="chat-title">${BOT_NAME}</b><button class="chat-minimize" type="button" data-x="chatmin" aria-label="Minimize ${BOT_NAME} chat">−</button></div>
    <p class="chat-notice">Practice chat. Replies are automatic. No real person is reading this.</p>
    <div class="chatlog" id="chatlog" aria-live="polite" aria-relevant="additions text"></div>
    <div class="chatq">${["Phone code not arriving", "Document verification problem", "Payment method problem", "Is this job real?"].map((q) => `<button class="tab" data-x="chatq" data-q="${q}">${q}</button>`).join("")}</div>
    <div class="chatin"><input id="chatin" type="text" placeholder="Type a message" aria-label="Message to ${BOT_NAME}" autocomplete="off"><button class="pr" data-x="chatsend">Send</button></div></div>`;
  document.body.appendChild(c);
  gid("chatin").addEventListener("keydown", (e) => { if (e.key === "Enter") chatSend(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !gid("chatbox").classList.contains("hidden")) chatMinimize();
  });
}
const chatAdd = (who, text) => {
  const log = gid("chatlog"), row = document.createElement("div"), d = document.createElement("div");
  row.className = who === "bot" ? "msg-row bot-row" : "msg-row";
  if (who === "bot") {
    const avatar = document.createElement("span");
    avatar.className = "chat-avatar small"; avatar.setAttribute("aria-hidden", "true"); avatar.textContent = "M"; row.appendChild(avatar);
  }
  d.className = "msg " + who; d.textContent = text; row.appendChild(d); log.appendChild(row); log.scrollTop = log.scrollHeight;
  if (who === "bot" && gid("chatbox").classList.contains("hidden")) gid("chat-unread").classList.remove("hidden");
};
function chatTyping() {
  const row = document.createElement("div"), avatar = document.createElement("span"), bubble = document.createElement("div");
  row.className = "msg-row";
  avatar.className = "chat-avatar small"; avatar.setAttribute("aria-hidden", "true"); avatar.textContent = "M";
  bubble.className = "msg bot";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    bubble.innerHTML = '<span class="typing-label">typing...</span>';
  } else {
    bubble.innerHTML = '<span class="typing-label">Matanda is typing<span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span></span>';
  }
  row.append(avatar, bubble); gid("chatlog").appendChild(row); gid("chatlog").scrollTop = gid("chatlog").scrollHeight;
  return row;
}
function chatSend(text) {
  const inp = gid("chatin"), t = (text || inp.value).trim();
  if (!t) return;
  inp.value = ""; chatAdd("me", t);
  const hit = BOT.find(([re]) => re.test(t));
  const reply = hit ? hit[1] : FALLBACK;
  const typing = chatTyping();
  const delay = Math.min(1800, Math.max(800, 800 + reply.length * 2));
  setTimeout(() => {
    typing.remove();
    chatAdd("bot", reply);
  }, delay);
}
function chatToggle() {
  const box = gid("chatbox"), open = box.classList.contains("hidden");
  box.classList.toggle("hidden", !open);
  gid("chat-launcher").setAttribute("aria-expanded", String(open));
  if (open) {
    gid("chat-unread").classList.add("hidden");
    if (!chatStarted) {
      chatStarted = true;
      const typing = chatTyping();
      setTimeout(() => {
        typing.remove();
        chatAdd("bot", "Hello! This is the Matanda practice assistant. Tell me what is not working, for example the phone code, your document check or a payment method. Replies are automatic.");
      }, 1000);
    }
  }
}
function chatMinimize() {
  gid("chatbox").classList.add("hidden");
  gid("chat-launcher").setAttribute("aria-expanded", "false");
  gid("chat-launcher").focus();
}

document.addEventListener("input", (event) => {
  if (event.target.id === "cardnumber") {
    const input = event.target, digits = input.value.replace(/\D/g, "").slice(0, 16);
    input.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    const brand = digits.startsWith("4") ? "Visa" : /^5[1-5]/.test(digits) ? "Mastercard" : "";
    const logo = gid("card-logo");
    logo.hidden = !brand;
    if (brand) {
      logo.src = `assets/payments/${brand.toLowerCase()}.svg`;
      logo.alt = `${brand} logo`;
    }
    gid("card-brand").textContent = brand || (digits ? "Unrecognized card brand" : "Enter a sample card number");
  } else if (event.target.id === "cardexpiry") {
    const input = event.target, digits = input.value.replace(/\D/g, "").slice(0, 4);
    input.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }
});

app.addEventListener("change", (event) => {
  if (event.target.id !== "fl") return;
  const input = event.target, file = input.files && input.files[0];
  const side = idState && idState.s === 3 ? "front" : "back";
  const status = gid("id-status"), next = gid("id-continue");
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    status.textContent = "Choose an image file only.";
    status.className = "no";
    input.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    status.textContent = "That image is larger than 5 MB. Choose a smaller image.";
    status.className = "no";
    input.value = "";
    return;
  }
  idState[side] = "Image selected";
  status.textContent = "Image selected";
  status.className = "mu";
  next.classList.remove("hidden");
  input.value = "";
});

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
  else if (x === "idfin") { acct.id = true; setup(); }
  else if (x === "paygo") payView();
  else if (x === "paypick") payView(b.dataset.m);
  else if (x === "paysample") {
    if (gid("cardholder")) {
      gid("cardholder").value = "Practice Student";
      gid("cardnumber").value = "4242 4242 4242 4242";
      gid("cardnumber").dispatchEvent(new Event("input", { bubbles: true }));
      const expiry = new Date(); expiry.setFullYear(expiry.getFullYear() + 1);
      gid("cardexpiry").value = `${String(expiry.getMonth() + 1).padStart(2, "0")}/${String(expiry.getFullYear()).slice(-2)}`;
      gid("cardcvc").value = "123";
    } else {
      gid("bankname").value = "Practice Bank";
      gid("accountholder").value = "Practice Student";
      gid("accountnumber").value = "0123456789";
      gid("swift").value = "DEMOUGKA";
    }
    const error = gid("pay-error"); if (error) error.classList.add("hidden");
  }
  else if (x === "paylink") {
    if (b.dataset.m === "PayPal" || b.dataset.m === "Payoneer") {
      if (gid("pe").value.trim().length < 3) return alert("Type a fake email.");
    } else if (b.dataset.m === "Mastercard or Visa card") {
      const card = gid("cardnumber").value.replace(/\D/g, "");
      const expiry = gid("cardexpiry").value.trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
      let futureExpiry = false;
      if (expiry) {
        const year = 2000 + Number(expiry[2]), month = Number(expiry[1]);
        const now = new Date();
        futureExpiry = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
      }
      const valid = gid("cardholder").value.trim() && ["4242424242424242", "5555555555554444"].includes(card) && futureExpiry && gid("cardcvc").value === "123";
      if (!valid) { gid("pay-error").classList.remove("hidden"); return; }
    } else if (b.dataset.m === "Bank account") {
      const valid = gid("bankname").value.trim() && gid("accountholder").value.trim() && gid("accountnumber").value === "0123456789" && gid("swift").value.trim();
      if (!valid) { gid("pay-error").classList.remove("hidden"); return; }
    }
    acct.pay = b.dataset.m; toast("Payment method linked (practice)."); setup();
  } else if (x === "jobgo") openJob(pendingJob);
  else if (x === "chat") chatToggle();
  else if (x === "chatmin") chatMinimize();
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

  if (action === "review-qa") {
    reviewSubmission(id);
    return;
  }

  if (action === "payment") {
    const job = find(id);
    const progress = proposalProgress[id];
    if (job && progress && progress.submission && progress.submission.qa && progress.submission.qa.accepted && progress.submission.payment) {
      showPaymentRecord(job, progress);
    }
    return;
  }

  if (action === "download-brief") {
    const job = find(id);
    const progress = proposalProgress[id];
    if (job && job.workItems && progress && progress.qualified) {
      downloadFile("review-sentiment-project-brief.txt", projectBrief(job, progress), "text/plain;charset=utf-8");
    }
    return;
  }

  if (action === "download-template") {
    const job = find(id);
    if (job && job.workItems && proposalProgress[id] && proposalProgress[id].qualified) {
      downloadFile("review-sentiment-template.csv", projectCsv(job), "text/csv;charset=utf-8");
    }
    return;
  }

  if (action === "submit-export") {
    submitExport(id);
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