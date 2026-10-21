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

// All rates and payout terms below are editable practice examples, not live offers.
const PAY_CONFIG = {
  platformFeePct: 10,
  minWithdrawalUSD: 5,
  withdrawalFeeUSD: 0.5,
  acceptThresholdPct: 80,
};

function money(usd) {
  const amount = Number(usd);
  return `$${amount.toFixed(2)} Practice money`;
}

const WALLET_STORAGE_KEY = "pda-wallet-v1";
const emptyWallet = () => ({ pending: 0, available: 0, withdrawn: 0, history: [] });
let walletStorageAvailable = true;

function validWallet(value) {
  return value && typeof value === "object" &&
    ["pending", "available", "withdrawn"].every((key) => Number.isFinite(value[key]) && value[key] >= 0) &&
    Array.isArray(value.history) &&
    value.history.every((item) => item && typeof item.jobId === "string" && Number.isFinite(item.amount));
}

function loadWallet() {
  try {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (stored === null) return emptyWallet();
    const parsed = JSON.parse(stored);
    if (validWallet(parsed)) return parsed;
    walletStorageAvailable = false;
  } catch (error) {
    walletStorageAvailable = false;
  }
  return emptyWallet();
}

let wallet = loadWallet();

function persistWallet() {
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
    walletStorageAvailable = true;
  } catch (error) {
    walletStorageAvailable = false;
  }
  updateWalletControls();
}

function updateWalletControls() {
  const status = document.getElementById("wallet-storage-status");
  if (status) {
    status.hidden = walletStorageAvailable;
    status.textContent = walletStorageAvailable ? "" : "Wallet data is session-only because browser storage is unavailable.";
  }
}

function addWalletControls() {
  const header = document.querySelector(".site-header");
  if (!header || document.getElementById("wallet-reset")) return;
  const reset = document.createElement("button");
  reset.id = "wallet-reset";
  reset.type = "button";
  reset.className = "gh footer-reset";
  reset.dataset.x = "wallet-reset";
  reset.textContent = "Reset practice data";
  reset.setAttribute("aria-label", "Reset practice earnings and progress");
  header.appendChild(reset);
  positionWalletReset();
  window.addEventListener("resize", positionWalletReset);

  const status = document.createElement("span");
  status.id = "wallet-storage-status";
  status.className = "mu";
  status.setAttribute("role", "status");
  status.hidden = walletStorageAvailable;
  header.appendChild(status);
  updateWalletControls();
}

function positionWalletReset() {
  const reset = document.getElementById("wallet-reset");
  const target = window.matchMedia("(max-width: 600px)").matches
    ? document.querySelector(".site-footer")
    : document.querySelector(".site-header");
  if (reset && target && reset.parentElement !== target) target.appendChild(reset);
}

function resetPracticeData() {
  if (!confirm("Reset your practice earnings and progress on this device?")) return;
  wallet = emptyWallet();
  name = "";
  acct.phone = false;
  acct.id = false;
  acct.pay = "";
  pendingJob = null;
  idState = null;
  filter = "all";
  modalityFilter = "all";
  visibleJobCount = 6;
  Object.keys(proposalProgress).forEach((id) => delete proposalProgress[id]);
  try {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    walletStorageAvailable = true;
  } catch (error) {
    walletStorageAvailable = false;
  }
  try {
    sessionStorage.removeItem(PRACTICE_STORAGE_KEY);
  } catch (error) {
    console.error("Unable to clear practice progress from session storage.", error);
  }
  persistWallet();
  gate();
}

/* ---------- Jobs: edit or add your own ---------- */
const LABELS = ["Positive", "Negative", "Neutral"];

function makeJob(spec) {
  const job = {
    ...spec,
    type: spec.kind,
    short: spec.summary,
    rate: spec.payModel.rate,
    estimatedHours: spec.payModel.maxHours,
    maxBillableHours: spec.payModel.maxHours,
    seats: "2 practice seats",
    cap: `${spec.payModel.maxHours} h/week`,
    pass: 4,
    qualification: {
      pass: 4,
      items: Array.from({ length: 5 }, (_, index) => {
        const standardChecks = [
          { q: "When the evidence is unclear, should you guess?", good: "No; follow the project rule or mark it unclear", bad: "Yes; fill in the most likely answer", why: "Do not invent details beyond the evidence." },
          { q: "Should you preserve the supplied task IDs and CSV columns?", good: "Yes; keep IDs and required columns unchanged", bad: "No; rename columns to your preference", why: "Stable IDs and headers are needed to validate an export." },
          { q: "Should you include personal details that are not needed for the task?", good: "No; include only the requested annotation", bad: "Yes; add any details you can infer", why: "Only task-relevant information belongs in the annotation." },
          { q: "What should guide the label?", good: "The project rule and evidence shown", bad: "A guess based on assumptions", why: "Apply the written rule consistently." },
        ];
        if (index > 0) return standardChecks[index - 1];
        const item = spec.quiz[index % spec.quiz.length];
        return { q: item.q, good: item.good, bad: item.bad, why: item.why };
      }),
    },
    workItems: spec.references.map((item) => ({
      ...item,
      q: item.text || item.clip || item.image || item.claim || item.question || item.sentence || item.context || item.scene || item.id,
    })),
    ok: spec.scam ? "The warning signs should be reported." : "Check the written terms and never pay to apply.",
    pay: "",
  };
  job.pay = formatJobPay(job);
  return job;
}

const JOBS = [
  makeJob({
    id: "j1", title: "Label customer reviews for an online shop", modality: "text", kind: "bid",
    client: "Small online retailer", summary: "Label each review as positive, negative or neutral. Flag unclear cases instead of guessing.",
    detail: "Review a small practice batch of customer comments and label the writer’s overall feeling. Use the whole comment, treat sarcasm by its intended meaning, and choose Neutral when facts have no feeling or positive and negative points balance. Do not infer a customer’s situation.",
    payModel: { type: "hourly", rate: 4, maxHours: 5, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Spreadsheet", "Labelbox", "CVAT"], deliverable: { format: "CSV", idColumn: "task_id", columns: ["task_id", "review_text", "label"], template: "reviews-template.csv" },
    scoring: { type: "classification", labels: LABELS }, assets: "assets/projects/j1/manifest.json",
    guidelines: ["Positive: clear praise or satisfaction. Example: “The delivery was quick and careful.”", "Negative: a complaint or warning. Example: “The zip broke on day one.”", "Neutral: facts or equally weighted praise and complaint. Sarcasm follows the intended meaning."],
    quiz: [{ q: "A review says “Perfect, another order lost.” Which label fits the sarcasm?", good: "Negative", bad: "Positive", why: "The writer is expressing frustration." }],
    references: [
      { id: "REV-001", text: "The delivery arrived early and everything was packed carefully.", label: "Positive", why: "The customer praises the delivery." },
      { id: "REV-002", text: "The jacket looks great, but the zip broke on the first day.", label: "Negative", why: "The product failure outweighs the brief praise." },
    ],
  }),
  makeJob({
    id: "j2", title: "Easy data entry. Earn $30 per hour, start today!", modality: "text", kind: "bid", scam: true,
    client: "Global Data Jobs Ltd", summary: "No experience needed. Pay a small fee for your software licence and start immediately.",
    detail: "To activate your account, send a $15 licence fee by mobile money, then send your ID photo and bank details on WhatsApp. Work starts today.",
    payModel: { type: "hourly", rate: 30, maxHours: 1, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Spreadsheet"], deliverable: { format: "CSV", idColumn: "task_id", columns: ["task_id", "label"], template: "scam-template.csv" },
    scoring: { type: "classification", labels: ["scam", "not_scam"] }, assets: "assets/projects/j2/manifest.json",
    guidelines: ["Never pay a fee to apply or unlock work.", "Do not send identity or bank details through chat.", "Verify the company and task through its official platform."],
    flags: ["It asks you to pay a fee before work. Real platforms never charge to apply.", "The pay is far too high for no experience.", "It moves you to WhatsApp and asks for your ID and bank details.", "It never describes the actual task."],
    quiz: [{ q: "The listing asks for an upfront licence fee. What should you do?", good: "Report it and do not pay", bad: "Pay quickly to secure a seat", why: "Legitimate platforms do not charge an application fee." }],
    references: [{ id: "SCAM-001", text: "Send a $15 fee and ID photo on WhatsApp.", label: "scam" }, { id: "SCAM-002", text: "Apply through the company’s verified platform; no payment is requested.", label: "not_scam" }],
  }),
  makeJob({
    id: "j3", title: "Text sentiment labeling qualification", modality: "text", kind: "qual", client: "ClearTone Research",
    summary: "Pass a short test on sentiment labels to unlock a practice annotation batch.",
    detail: "Read each short sentence and select the feeling expressed by its writer. The test covers direct praise, complaints, factual statements and sarcasm. It is a practice qualification with no paid tasks or real client.",
    payModel: { type: "perTask", rate: 0.04, maxHours: 3, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Spreadsheet"], deliverable: { format: "CSV", idColumn: "task_id", columns: ["task_id", "text", "label"], template: "sentiment-template.csv" },
    scoring: { type: "classification", labels: LABELS }, assets: "assets/projects/j3/manifest.json",
    guidelines: ["Read the complete sentence before choosing.", "Treat sarcasm by the meaning, not the literal words.", "Use Neutral for facts or equally balanced positive and negative details."],
    quiz: [{ q: "“Nobody should buy it; the screen failed on day one.”", good: "Negative", bad: "Neutral", why: "This is a clear complaint and warning." }],
    references: [{ id: "SENT-001", text: "I love how easy the dashboard is.", label: "Positive" }, { id: "SENT-002", text: "The package contains two notebooks.", label: "Neutral" }],
  }),
  makeJob({
    id: "j4", title: "Which answer is better?", modality: "text", kind: "pool", client: "AnswerBench Studio",
    summary: "Compare short AI answers and select the response that best follows the request and stays accurate.",
    detail: "Compare two candidate answers to a single prompt. Prefer factual, relevant answers that follow the requested format. Do not reward confidence when a response invents facts, and do not prefer a longer answer unless the task requires detail.",
    payModel: { type: "perTask", rate: 0.05, maxHours: 3, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Spreadsheet"], deliverable: { format: "CSV", idColumn: "task_id", columns: ["task_id", "label"], template: "answers-template.csv" },
    scoring: { type: "classification", labels: ["A", "B"] }, assets: "assets/projects/j4/manifest.json",
    guidelines: ["Check factual claims.", "Follow the requested format and length.", "Choose A for the stronger answer, B for the weaker one; both can be imperfect."],
    quiz: [{ q: "An answer is confident but names the wrong capital. Which should you prefer?", good: "The accurate answer", bad: "The confident answer", why: "Factual correctness matters more than confidence." }],
    references: [{ id: "AB-001", text: "What is Uganda’s capital?", label: "A" }, { id: "AB-002", text: "Explain a refund in one sentence.", label: "A" }],
  }),
  makeJob({
    id: "t1", title: "Classify shop-chat assistant intents", modality: "text", kind: "pool", client: "ShopPilot Labs",
    summary: "Assign one intent to each short customer message.",
    detail: "Classify customer messages by the main help request: refund, delivery_status, account_help, complaint or other. Select one primary label. If a message mentions an order but asks to return it, refund is the intent; unclear or unrelated requests use other.",
    payModel: { type: "perTask", rate: 0.04, maxHours: 4, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Spreadsheet", "Labelbox"], deliverable: { format: "CSV", idColumn: "task_id", columns: ["task_id", "message", "label"], template: "intent-template.csv" },
    scoring: { type: "classification", labels: ["refund", "delivery_status", "account_help", "complaint", "other"] }, assets: "assets/projects/t1/manifest.json",
    guidelines: ["Choose the main requested action, not every topic mentioned.", "Refund includes returning money or goods.", "Use other for unclear, greeting-only or unrelated messages."],
    quiz: [{ q: "“Where is my parcel?”", good: "delivery_status", bad: "account_help", why: "The customer asks for the shipment status." }],
    references: [{ id: "T1-001", text: "Please return the money for my damaged order.", label: "refund" }, { id: "T1-002", text: "I cannot sign in to my profile.", label: "account_help" }],
  }),
  makeJob({
    id: "t2", title: "Tag names and places in short news sentences", modality: "text", kind: "bid", client: "Civic News Index",
    summary: "Mark each named entity as PERSON, PLACE or ORGANIZATION.",
    detail: "Identify explicit person, place and organization names in short fictional news-style sentences. Keep the exact spelling and punctuation-free entity text. Do not tag ordinary job titles or common nouns unless part of a proper name.",
    payModel: { type: "hourly", rate: 4.5, maxHours: 5, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Labelbox", "Spreadsheet"], deliverable: { format: "CSV", idColumn: "task_id", columns: ["task_id", "entity_text", "type"], template: "ner-template.csv" },
    scoring: { type: "ner", labels: ["PERSON", "PLACE", "ORGANIZATION"] }, assets: "assets/projects/t2/manifest.json",
    guidelines: ["Use exact entity boundaries and spelling.", "PERSON is an individual; PLACE is a location.", "ORGANIZATION includes named companies, agencies and institutions; do not guess implied names."],
    quiz: [{ q: "In “Amina visited Nairobi,” what is Nairobi?", good: "PLACE", bad: "ORGANIZATION", why: "Nairobi is a named city." }],
    references: [
      { id: "T2-001", text: "Amina met the team in Kampala.", entities: [{ entity_text: "Amina", type: "PERSON" }] },
      { id: "T2-002", text: "Lakeview Clinic opened in Jinja.", entities: [{ entity_text: "Lakeview Clinic", type: "ORGANIZATION" }] },
    ],
  }),
  makeJob({
    id: "t3", title: "Label topics in short articles", modality: "text", kind: "pool", client: "TopicMap Learning",
    summary: "Assign one main topic to each short article.",
    detail: "Label the central subject of short article summaries as sports, health, business, education or other. Choose the topic that best describes the main point, not a passing mention. Use other when no listed topic is central.",
    payModel: { type: "perTask", rate: 0.03, maxHours: 4, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Spreadsheet"], deliverable: { format: "CSV", idColumn: "task_id", columns: ["task_id", "article", "label"], template: "topic-template.csv" },
    scoring: { type: "classification", labels: ["sports", "health", "business", "education", "other"] }, assets: "assets/projects/t3/manifest.json",
    guidelines: ["Choose the article’s main focus.", "A passing example does not change the primary topic.", "Use other for unrelated or too-vague summaries."],
    quiz: [{ q: "A report is mainly about a school’s new reading curriculum.", good: "education", bad: "business", why: "The main subject is learning and schools." }],
    references: [{ id: "T3-001", text: "The regional team won its final match.", label: "sports" }, { id: "T3-002", text: "A clinic introduced a new malaria screening service.", label: "health" }],
  }),
  makeJob({
    id: "t4", title: "Flag suspicious messages", modality: "text", kind: "pool", client: "SafeInbox Cooperative",
    summary: "Classify messages as scam or not_scam based on concrete warning signs.",
    detail: "Review short fictional messages for impersonation, urgent payment demands, suspicious links or requests for credentials. Use scam only when clear indicators appear; ordinary delivery updates without credential requests are not automatically scams.",
    payModel: { type: "perTask", rate: 0.05, maxHours: 4, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Spreadsheet"], deliverable: { format: "CSV", idColumn: "task_id", columns: ["task_id", "message", "label"], template: "scam-messages-template.csv" },
    scoring: { type: "classification", labels: ["scam", "not_scam"] }, assets: "assets/projects/t4/manifest.json",
    guidelines: ["Scam: impersonation, pressure, requests for money or passwords.", "Not_scam: routine notice with no suspicious request.", "Never open links or contact the sender during labeling."],
    quiz: [{ q: "A message asks for a password through an unfamiliar link.", good: "scam", bad: "not_scam", why: "Credential collection through an unverified link is a strong warning." }],
    references: [{ id: "T4-001", text: "Pay a fee now to release your prize.", label: "scam" }, { id: "T4-002", text: "Your library book is due Friday; sign in on the usual site.", label: "not_scam" }],
  }),
  makeJob({
    id: "t5", title: "Fact-check short claims", modality: "text", kind: "bid", client: "PlainFact Desk",
    summary: "Judge whether each claim is true, false or cannot_tell from the supplied evidence.",
    detail: "Compare each claim only with the short evidence note in the task. Use true when supported, false when contradicted, and cannot_tell when the note does not settle it. Do not use outside assumptions or treat missing evidence as proof of falsity.",
    payModel: { type: "perTask", rate: 0.08, maxHours: 4, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Spreadsheet"], deliverable: { format: "CSV", idColumn: "task_id", columns: ["task_id", "label"], template: "fact-check-template.csv" },
    scoring: { type: "classification", labels: ["true", "false", "cannot_tell"] }, assets: "assets/projects/t5/manifest.json",
    guidelines: ["true means the evidence supports the claim.", "false means the evidence directly contradicts it.", "cannot_tell means relevant evidence is absent or ambiguous."],
    quiz: [{ q: "The evidence gives no date for a claim about when an event happened.", good: "cannot_tell", bad: "false", why: "No evidence does not prove the claim false." }],
    references: [{ id: "T5-001", text: "Evidence: the clinic opened in 2020. Claim: it opened in 2020.", label: "true" }, { id: "T5-002", text: "Evidence: the clinic opened in 2020. Claim: it opened in 2018.", label: "false" }],
  }),
  makeJob({
    id: "t6", title: "Rate AI answers for helpfulness", modality: "text", kind: "bid", client: "UsefulReply Research",
    summary: "Rate each answer from 1 to 5 using relevance, correctness and clarity.",
    detail: "Score helpfulness from 1 (not useful) to 5 (fully helpful). Consider whether the answer addresses the prompt, is factually sound and is understandable. A polished but incorrect answer should score low; do not penalize a concise answer that fully responds.",
    payModel: { type: "hourly", rate: 5.5, maxHours: 5, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Spreadsheet"], deliverable: { format: "CSV", idColumn: "task_id", columns: ["task_id", "rating"], template: "ratings-template.csv" },
    scoring: { type: "rating", min: 1, max: 5 }, assets: "assets/projects/t6/manifest.json",
    guidelines: ["1: irrelevant or materially wrong.", "3: partly useful with a significant gap.", "5: correct, relevant and clear; intermediate scores reflect smaller gaps."],
    quiz: [{ q: "An answer is fluent but gives a wrong capital city.", good: "1 — materially wrong", bad: "5 — fully helpful", why: "Factual error is more important than fluent wording." }],
    references: [{ id: "T6-001", text: "Prompt: name Uganda’s capital. Answer: Kampala is Uganda’s capital.", rating: 5 }, { id: "T6-002", text: "Prompt: name Uganda’s capital. Answer: Entebbe is Uganda’s capital.", rating: 1 }],
  }),
  makeJob({
    id: "i1", title: "Classify everyday photographs", modality: "image", kind: "pool", client: "CommonScene Archive",
    summary: "Choose the main visible category: animals, vehicles, food or buildings.",
    detail: "Classify the dominant subject in each approved practice photograph. Choose animals, vehicles, food or buildings. If several subjects appear, label the clearest main subject; use the supplied task note when the image is genuinely ambiguous.",
    payModel: { type: "perTask", rate: 0.04, maxHours: 4, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Labelbox", "CVAT"], deliverable: { format: "CSV", idColumn: "task_id", columns: ["task_id", "label"], template: "image-classification-template.csv" },
    scoring: { type: "classification", labels: ["animals", "vehicles", "food", "buildings"] }, assets: "assets/projects/i1/manifest.json",
    guidelines: ["Choose the dominant subject, not background objects.", "Use only visible evidence.", "Do not identify people or infer personal details."],
    quiz: [{ q: "A photo centers on a parked bicycle with a building in the background.", good: "vehicles", bad: "buildings", why: "The bicycle is the dominant subject." }],
    references: [{ id: "I1-001", image: "image-01.jpg", label: "animals" }, { id: "I1-002", image: "image-02.jpg", label: "food" }],
  }),
  makeJob({
    id: "i2", title: "Draw boxes around bicycles and motorbikes", modality: "image", kind: "bid", client: "StreetObject Index",
    summary: "Annotate bicycles and motorbikes with pixel-coordinate boxes; use CVAT or Labelbox.",
    detail: "Draw a tight rectangular box around each visible bicycle or motorbike. Include the full vehicle, exclude unrelated road area, and use pixel coordinates from the original image. If partly occluded, box the visible extent and label the object that can still be identified.",
    payModel: { type: "hourly", rate: 5, maxHours: 5, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["CVAT", "Labelbox"], deliverable: { format: "CSV", idColumn: "image", columns: ["image", "label", "x", "y", "width", "height"], template: "bounding-boxes-template.csv" },
    scoring: { type: "bbox", labels: ["motorbike", "bicycle"], iou: 0.5 }, assets: "assets/projects/i2/manifest.json",
    guidelines: ["Use x/y as the top-left pixel and positive width/height.", "Box the visible vehicle extent, not its shadow.", "Export annotations to CSV and preserve image filenames."],
    quiz: [{ q: "A bicycle is partly behind a parked car. What should the box cover?", good: "The visible bicycle extent", bad: "The whole car and bicycle area", why: "Boxes should closely contain the target object." }],
    references: [{ id: "image-01.jpg", label: "bicycle", x: 30, y: 40, width: 120, height: 80 }, { id: "image-02.jpg", label: "motorbike", x: 55, y: 25, width: 160, height: 110 }],
  }),
  makeJob({
    id: "i3", title: "Tag image quality", modality: "image", kind: "pool", client: "BrightFrame Review",
    summary: "Mark each image ok, blurry or too_dark.",
    detail: "Judge whether each practice image is usable for its intended label task. Choose ok, blurry or too_dark. Minor compression is acceptable if the subject is readable; select the strongest defect when an image is both dim and slightly soft.",
    payModel: { type: "perTask", rate: 0.03, maxHours: 4, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Spreadsheet"], deliverable: { format: "CSV", idColumn: "task_id", columns: ["task_id", "label"], template: "image-quality-template.csv" },
    scoring: { type: "classification", labels: ["ok", "blurry", "too_dark"] }, assets: "assets/projects/i3/manifest.json",
    guidelines: ["ok means the subject is legible.", "blurry means focus prevents reliable identification.", "too_dark means insufficient light obscures the subject."],
    quiz: [{ q: "The subject is in focus and clearly visible despite mild compression.", good: "ok", bad: "blurry", why: "Minor compression alone does not make an image unusable." }],
    references: [{ id: "I3-001", image: "image-01.jpg", label: "ok" }, { id: "I3-002", image: "image-02.jpg", label: "too_dark" }],
  }),
  makeJob({
    id: "i4", title: "Transcribe visible sign and label text", modality: "image", kind: "pool", client: "ReadableWorld Catalog",
    summary: "Transcribe only readable text visible in approved sample images.",
    detail: "Copy the visible words from a sign or product label, preserving wording and reading order. Use [illegible] for an unreadable span; do not guess obscured characters. Do not record personal names, phone numbers, addresses or other personal data.",
    payModel: { type: "perTask", rate: 0.06, maxHours: 4, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Spreadsheet"], deliverable: { format: "CSV", idColumn: "task_id", columns: ["task_id", "transcript"], template: "image-transcription-template.csv" },
    scoring: { type: "transcript" }, assets: "assets/projects/i4/manifest.json",
    guidelines: ["Read top-to-bottom and left-to-right unless layout clearly differs.", "Use [illegible] rather than guessing.", "Skip personal data; report any accidentally included."],
    quiz: [{ q: "One word is obscured by glare. What should you enter?", good: "[illegible]", bad: "A guessed word", why: "Transcribe only what is visible." }],
    references: [{ id: "image-01.jpg", transcript: "FRESH MARKET" }, { id: "image-02.jpg", transcript: "OPEN DAILY" }],
  }),
  makeJob({
    id: "a1", title: "Transcribe short English clips", modality: "audio", kind: "bid", client: "ClearSpeech Library",
    summary: "Write the spoken English words in short practice recordings.",
    detail: "Transcribe the spoken words in short English recordings. Use punctuation for readability, mark unclear speech as [unclear], and do not invent missing words. Clips are staged examples only; do not submit recordings containing personal or sensitive information.",
    payModel: { type: "perTask", rate: 0.08, maxHours: 4, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Audio editor", "Spreadsheet"], deliverable: { format: "CSV", idColumn: "clip_id", columns: ["clip_id", "transcript"], template: "transcripts-template.csv" },
    scoring: { type: "transcript", maxWer: 0.25 }, assets: "assets/projects/a1/manifest.json",
    guidelines: ["Transcribe words, not background sounds.", "Use [unclear] for unintelligible speech.", "Punctuation and case are ignored by scoring."],
    quiz: [{ q: "A short word cannot be understood after replaying the clip.", good: "Mark [unclear]", bad: "Guess from context", why: "Do not invent speech." }],
    references: [{ id: "clip-01.mp3", transcript: "Please leave the package by the door." }, { id: "clip-02.mp3", transcript: "The meeting begins at nine." }],
  }),
  makeJob({
    id: "a2", title: "Identify languages in short clips", modality: "audio", kind: "pool", client: "LinguaTag Network",
    summary: "Tag each clip English, French, Swahili or other.",
    detail: "Identify the primary spoken language in each short clip. Choose English, French, Swahili or other. A brief greeting in another language does not override a longer main-language segment; use other when the speech is not one of the listed choices.",
    payModel: { type: "perTask", rate: 0.04, maxHours: 4, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Audio editor", "Spreadsheet"], deliverable: { format: "CSV", idColumn: "clip_id", columns: ["clip_id", "label"], template: "language-tags-template.csv" },
    scoring: { type: "classification", labels: ["English", "French", "Swahili", "other"] }, assets: "assets/projects/a2/manifest.json",
    guidelines: ["Use the main spoken language.", "Do not infer language from the speaker’s identity.", "Use other for unlisted or no intelligible speech."],
    quiz: [{ q: "Most of a clip is Swahili with one English place name.", good: "Swahili", bad: "English", why: "Choose the dominant language." }],
    references: [{ id: "clip-01.mp3", label: "English" }, { id: "clip-02.mp3", label: "Swahili" }],
  }),
  makeJob({
    id: "a3", title: "Tag sound events with start and end times", modality: "audio", kind: "pool", client: "Soundscape Atlas",
    summary: "Mark speech, music, motorbike and rain events with times in seconds.",
    detail: "Record each audible target event with a label and start/end time in seconds from the clip beginning. Include speech, music, motorbike and rain. Overlapping events may have overlapping intervals; do not extend a segment into silence.",
    payModel: { type: "perTask", rate: 0.07, maxHours: 4, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Audio editor", "Spreadsheet"], deliverable: { format: "CSV", idColumn: "clip_id", columns: ["clip_id", "label", "start_seconds", "end_seconds"], template: "sound-events-template.csv" },
    scoring: { type: "sound_events", labels: ["speech", "music", "motorbike", "rain"], overlap: 0.5 }, assets: "assets/projects/a3/manifest.json",
    guidelines: ["Times are seconds from the start of the clip.", "End must be greater than start.", "Separate overlapping event types into separate rows."],
    quiz: [{ q: "Rain continues while music plays. How should you annotate?", good: "Create overlapping rows for both", bad: "Keep only the louder event", why: "Distinct audible events may overlap." }],
    references: [{ id: "clip-01.mp3", label: "speech", start: 0.4, end: 2.8 }, { id: "clip-02.mp3", label: "rain", start: 1.2, end: 4.5 }],
  }),
  makeJob({
    id: "v1", title: "Tag actions in short video clips", modality: "video", kind: "bid", client: "MotionNote Studio",
    summary: "Label visible actions: walking, running, sitting or waving.",
    detail: "Choose the main visible action in each short approved clip. Use walking, running, sitting or waving. If multiple actions appear, label the clearest target action shown in the task; do not infer actions outside the visible frames.",
    payModel: { type: "perTask", rate: 0.06, maxHours: 4, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Spreadsheet", "CVAT"], deliverable: { format: "CSV", idColumn: "clip_id", columns: ["clip_id", "label"], template: "action-tags-template.csv" },
    scoring: { type: "classification", labels: ["walking", "running", "sitting", "waving"] }, assets: "assets/projects/v1/manifest.json",
    guidelines: ["Label visible motion, not presumed intent.", "Walking and running differ by clear running motion.", "Use the task’s primary action when several occur."],
    quiz: [{ q: "A person remains seated and raises a hand to greet someone.", good: "waving", bad: "running", why: "The visible action is a wave." }],
    references: [{ id: "clip-01.mp4", label: "walking" }, { id: "clip-02.mp4", label: "waving" }],
  }),
  makeJob({
    id: "v2", title: "Mark when a person waves", modality: "video", kind: "pool", client: "FrameMoment QA",
    summary: "Record the start and end seconds of the visible waving event.",
    detail: "Mark the interval where a person visibly waves in each clip. Use seconds from video start, include the continuous wave, and stop when the arm returns to rest. If no wave is visible, use the provided no_event label and leave times blank.",
    payModel: { type: "perTask", rate: 0.07, maxHours: 4, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["CVAT", "Spreadsheet"], deliverable: { format: "CSV", idColumn: "clip_id", columns: ["clip_id", "label", "start_seconds", "end_seconds"], template: "wave-events-template.csv" },
    scoring: { type: "video_segments", labels: ["person_waves"], overlap: 0.5 }, assets: "assets/projects/v2/manifest.json",
    guidelines: ["Use seconds from the first video frame.", "Start at the first clear wave motion.", "End when waving stops; do not include unrelated gestures."],
    quiz: [{ q: "The arm stays raised but does not move in a wave.", good: "Do not mark a waving event", bad: "Mark the entire clip as waving", why: "A wave requires visible waving motion." }],
    references: [{ id: "clip-01.mp4", label: "person_waves", start: 1.0, end: 3.0 }, { id: "clip-02.mp4", label: "person_waves", start: 2.0, end: 4.0 }],
  }),
  makeJob({
    id: "v3", title: "Describe scene conditions in clips", modality: "video", kind: "pool", client: "SceneCount Research",
    summary: "Tag indoor/outdoor, day/night and visible people count.",
    detail: "For each clip, label the main scene as indoor or outdoor, day or night, and count visible people as 0, 1 or 2+. Use the dominant scene if the clip changes location; do not count posters, reflections or people only mentioned in dialogue.",
    payModel: { type: "perTask", rate: 0.06, maxHours: 4, minAccuracy: 0.8 }, deadline: { days: 7, timeZone: "Africa/Kampala" },
    tools: ["Spreadsheet", "CVAT"], deliverable: { format: "CSV", idColumn: "clip_id", columns: ["clip_id", "label"], template: "scene-tags-template.csv" },
    scoring: { type: "classification", labels: ["indoor_day_0", "indoor_day_1", "indoor_day_2+", "indoor_night_0", "indoor_night_1", "indoor_night_2+", "outdoor_day_0", "outdoor_day_1", "outdoor_day_2+", "outdoor_night_0", "outdoor_night_1", "outdoor_night_2+"] }, assets: "assets/projects/v3/manifest.json",
    guidelines: ["Day/night is based on visible lighting and scene context.", "Count people physically visible, not posters or dialogue references.", "Use the dominant setting for clips with brief transitions."],
    quiz: [{ q: "A daytime outdoor clip shows three people. Which combined tag fits?", good: "outdoor_day_2+", bad: "indoor_night_1", why: "Use setting, time and 2+ people." }],
    references: [{ id: "clip-01.mp4", label: "outdoor_day_1" }, { id: "clip-02.mp4", label: "indoor_night_2+" }],
  }),
];

function formatJobPay(job) {
  const { type, rate } = job.payModel;
  return type === "hourly" ? `$${rate.toFixed(2)} per hour` : `$${rate.toFixed(2)} per task`;
}

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
let visibleJobCount = 6;
let modalityFilter = "all";

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
  persistPracticeState();
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
  const filteredJobs = JOBS.filter((job) =>
    (filter === "all" || job.kind === filter) &&
    (modalityFilter === "all" || job.modality === modalityFilter)
  );
  const list = filteredJobs.slice(0, visibleJobCount);

  draw(`
    <div class="board-hero">
      <div class="hero-content">
        <div class="bar">
          <h1>Open jobs</h1>
          <span>${esc(name)} <button class="gh" data-act="rename">Change name</button></span>
        </div>
        <p>New to this? <a href="practice.html" target="_blank" rel="noopener">Practise with timed drills</a> before you take a test.</p>
      </div>
    </div>
    <p><button class="gh" data-act="wallet">My earnings</button></p>
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
    <div class="modality-filters" role="group" aria-label="Filter jobs by modality">
      ${[["all", "All"], ["text", "Text"], ["image", "Image"], ["audio", "Audio"], ["video", "Video"]].map(([value, label]) =>
        `<button class="tab" data-act="modality-filter" data-id="${value}" aria-pressed="${modalityFilter === value}">${label}</button>`
      ).join("")}
    </div>
    <p class="mu" aria-live="polite">Showing ${list.length} of ${JOBS.length}</p>
    <p><button class="gh${list.length >= filteredJobs.length ? " hidden" : ""}" data-act="see-more">See more jobs</button></p>
    ${list
      .map(
        (job) => `
          <div class="card">
            <div>
              <h2>${esc(job.title)}</h2>
              ${job.client ? `<p class="mu">Client: ${esc(job.client)}</p>` : ""}
              <p>${esc(job.summary)}</p>
              <div class="meta">
                <span class="mu">Availability<b>${esc(job.seats)}</b></span>
                <span class="mu">Expected capacity<b>${esc(job.cap)}</b></span>
                <span class="mu">Style<b>${kind[job.kind]}</b></span>
                <span class="mu">Modality<b>${esc(job.modality)}</b></span>
              </div>
            </div>
            <div class="side">
              <div class="pay">${esc(job.pay)}</div>
              ${job.kind === "qual" ? '<span class="step">1 step to qualify</span>' : ""}
              ${job.kind === "bid" && proposalProgress[job.id] && proposalProgress[job.id].accepted ? '<span class="step">Proposal accepted</span>' : ""}
              <button class="${job.kind === "pool" ? "pr" : "gh"}" data-act="open" data-id="${job.id}">
                ${job.kind === "bid" ? proposalProgress[job.id] && proposalProgress[job.id].accepted ? "View accepted offer" : "View and bid" : job.kind === "qual" ? "Start qualification" : "Start project"}
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

function startJobProgress(job) {
  if (!proposalProgress[job.id]) {
    const issuedAt = new Date();
    proposalProgress[job.id] = {
      accepted: job.kind !== "bid" || !job.scam,
      qualified: false,
      issuedAt,
      deadline: createDeadline(issuedAt),
      tool: job.tools[0],
      hours: null,
    };
  }
  return proposalProgress[job.id];
}

function openJob(id) {
  const job = find(id);
  if (!job) return board();

  if (job.kind === "bid") {
    if (proposalProgress[id] && proposalProgress[id].accepted) return offerJob(job);
    draw(`
      <button class="gh" data-act="back">Back to jobs</button>
      <h1>${esc(job.title)}</h1>
      <p class="mu">Client: ${esc(job.client)}. ${esc(job.pay)}. ${esc(job.seats)}.</p>
      <div class="panel"><h2>Project preview</h2><p>${esc(job.short)}</p><p class="mu">The full brief and project guidelines are shared after a client accepts your proposal.</p></div>
      ${job.scam ? `<div class="panel no"><h2>Scam warning</h2><p>Never pay the requested $15 software fee or send identity and bank details through WhatsApp.</p><ul>${job.flags.map((flag) => `<li>${esc(flag)}</li>`).join("")}</ul></div>` : ""}
      <label class="f" for="tool">Tool you will use</label>
      <select id="tool">${job.tools.map((tool) => `<option>${esc(tool)}</option>`).join("")}</select>
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

  const progress = startJobProgress(job);
  if (job.kind === "pool") {
    progress.qualified = true;
    return showProjectPack(job, progress);
  }
  openAssessment(job);
}

function offerJob(job) {
  const progress = startJobProgress(job);
  if (progress.qualified) return showProjectPack(job, progress);
  draw(`
    <button class="gh" data-act="back">Back to jobs</button>
    <h1>Client accepted your proposal</h1>
    <p class="mu">Simulated offer · no real client or email is involved.</p>
    <div class="panel">
      <h2>In-app notification</h2>
      <p><b>From:</b> ${esc(job.client)}</p>
      <p><b>Subject:</b> Your proposal was accepted: ${esc(job.title)}</p>
      <p>Hello ${esc(name)}, your proposal was accepted. Complete the qualification test to unlock the project pack.</p>
      <p class="mu">Email preview only — nothing was sent to an email address.</p>
    </div>
    <div class="panel"><h2>Next step: qualification</h2><p>Pass a short test on this project’s rules to unlock its project pack.</p><button class="pr" data-act="qualify" data-id="${job.id}">Take qualification test</button></div>
  `);
}

function openAssessment(job) {
  const assessment = job.qualification || job;
  rows = assessment.items.map((item) => {
    const options = shuffle([
      [item.good, true],
      [item.bad, false],
    ]);

    return {
      q: item.q,
      o: options.map(([text]) => text),
      c: options.findIndex(([, isGood]) => isGood),
      why: item.why,
    };
  });

  draw(`
    <button class="gh" data-act="back">Back to jobs</button>
    <h1>${esc(job.title)}</h1>
    <p class="mu">Practice qualification · Pass mark: ${assessment.pass} out of ${assessment.items.length}.</p>
    <div class="panel"><h2>Project rules</h2><ul>${job.guidelines.map((rule) => `<li>${esc(rule)}</li>`).join("")}</ul></div>
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
                    ${esc(option)}
                  </label>
                `
              )
              .join("")}
          </fieldset>
        `
      )
      .join("")}
    <p><button class="pr" data-act="quiz" data-id="${job.id}" data-qualification="true">Submit answers</button></p>
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
  const isQualification = qualification || job.kind === "qual" || job.kind === "bid";
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

  const progress = startJobProgress(job);
  if (isQualification && passed) {
    progress.qualified = true;
    progress.quizScore = score;
  }

  const qualifiedForJob = isQualification && passed;
  if (qualifiedForJob) return showProjectPack(job, progress);
  draw(`
    <h1>${score} out of ${total}</h1>
    <div class="panel">
      <p><b>${passed === null ? "Round complete." : passed ? qualifiedForJob ? "Qualification passed. The full job description is unlocked." : "You qualified. On a real platform, paid tasks would unlock now." : "Not qualified this time. Read the rules again and try once more."}</b></p>
      <p class="mu">${statusText(result)}</p>
      <p>
        <button class="gh" data-act="copy">Copy my results</button>
        ${passed === false ? `<button class="gh" data-act="${job.kind === "bid" ? "qualify" : "open"}" data-id="${job.id}">Try again</button>` : ""}
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

function valuesForExport(job, item, includeAnswers) {
  if (job.scoring.type === "ner") {
    const entities = includeAnswers ? item.entities : [{ entity_text: "", type: "" }];
    return entities.map((entity) => job.deliverable.columns.map((column) => {
      if (column === "task_id") return item.id;
      if (column === "entity_text") return entity.entity_text;
      if (column === "type") return entity.type;
      return "";
    }));
  }
  return [job.deliverable.columns.map((column) => {
    if (column === job.deliverable.idColumn) return item.id;
    if (column === "label") return includeAnswers ? (item.label || "") : "";
    if (column === "transcript") return includeAnswers ? (item.transcript || "") : "";
    if (column === "rating") return includeAnswers ? (item.rating ?? "") : "";
    if (column === "x") return includeAnswers ? (item.x ?? "") : "";
    if (column === "y") return includeAnswers ? (item.y ?? "") : "";
    if (column === "width") return includeAnswers ? (item.width ?? "") : "";
    if (column === "height") return includeAnswers ? (item.height ?? "") : "";
    if (column === "start_seconds") return includeAnswers ? (item.start ?? "") : "";
    if (column === "end_seconds") return includeAnswers ? (item.end ?? "") : "";
    if (["review_text", "text", "message", "article"].includes(column)) return item.text || "";
    return "";
  })];
}

function projectCsv(job, includeAnswers = false) {
  const taskRows = job.workItems.slice(0, includeAnswers ? 2 : job.workItems.length)
    .flatMap((item) => valuesForExport(job, item, includeAnswers));
  return [job.deliverable.columns, ...taskRows].map((row) => row.map(csvCell).join(",")).join("\r\n");
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
    "PRACTICE PROJECT BRIEF — SIMULATED TRAINING",
    "",
    `Project: ${job.title}`,
    `Client: ${job.client}`,
    `Issued: ${formatDate(progress.issuedAt)} (Africa/Kampala)`,
    `Deadline: ${formatDeadline(progress.deadline)} (Africa/Kampala, EAT / UTC+3)`,
    "",
    job.detail,
    "",
    "LABELING GUIDELINES",
    ...job.guidelines.map((rule) => `- ${rule}`),
    "",
    `Allowed tools: ${job.tools.join(", ")}.`,
    "Export tip: Keep the template columns unchanged and export as UTF-8 CSV.",
    `Deliverable: ${job.deliverable.format} with columns ${job.deliverable.columns.join(", ")}.`,
    `Scoring: ${job.scoring.type}; pass threshold ${Math.round(job.payModel.minAccuracy * 100)}%.`,
    `Pay: Example values. Real platforms set their own. ${job.payModel.type === "hourly" ? `$${job.payModel.rate.toFixed(2)} per hour, up to ${job.payModel.maxHours} hours.` : `$${job.payModel.rate.toFixed(2)} per accepted task.`}`,
    "",
    "This is practice work only. No real client receives a submission.",
  ].join("\n");
}

async function projectResources(job) {
  const response = await fetch(job.assets, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Project manifest unavailable (${response.status}).`);
  const manifest = await response.json();
  const directory = new URL(".", new URL(job.assets, window.location.href));
  const availableUrl = (filename, available) => {
    if (!available) return "";
    if (typeof filename !== "string" || filename.includes("..") || filename.startsWith("/") || filename.includes("\\")) return "";
    return new URL(filename, directory).href;
  };
  const archiveEntry = manifest.archive;
  const archive = archiveEntry && typeof archiveEntry === "object"
    ? availableUrl(archiveEntry.path, archiveEntry.available === true)
    : "";
  const files = (Array.isArray(manifest.files) ? manifest.files : []).map((entry) => {
    const path = typeof entry === "string" ? entry : entry && entry.path;
    return {
      name: typeof path === "string" ? path : "Invalid asset entry",
      url: entry && typeof entry === "object" ? availableUrl(path, entry.available === true) : "",
    };
  });
  return { archive, files };
}

function toolExportTip(job) {
  if (job.tools.includes("CVAT")) return "Export annotations from CVAT as CSV, then keep the listed column names.";
  if (job.tools.includes("Labelbox")) return "Export labels from Labelbox as CSV and map them to the listed columns.";
  if (job.tools.includes("Audio editor")) return "Use the editor timeline to record timestamps, then fill the CSV template.";
  return "Fill the template in a spreadsheet and export as UTF-8 CSV.";
}

async function showProjectPack(job, progress) {
  if (progress.submission && progress.submission.qa && progress.submission.qa.accepted) return showPaymentRecord(job, progress);
  if (progress.submission && !progress.submission.qa) return showSubmissionReceipt(job, progress);
  let resources = { archive: "", files: [] };
  let manifestError = "";
  try {
    resources = await projectResources(job);
  } catch (error) {
    manifestError = error instanceof Error ? error.message : "Could not read project manifest.";
  }
  const mediaFiles = resources.files.filter((file) => file.url);
  const hasMissingAssets = !resources.archive || resources.files.some((file) => !file.url);
  const mediaNotice = hasMissingAssets
    ? '<p class="no" role="status">This project pack is being prepared</p>'
    : "";
  const links = resources.files.map((file) => `<li>${file.url
    ? `<a href="${esc(file.url)}" download>${esc(file.name)}</a>`
    : `${esc(file.name)} — <span class="mu">This project pack is being prepared</span>`}</li>`).join("");
  const previews = mediaFiles.map((file) => {
    const safeName = esc(file.name);
    const src = esc(file.url);
    if (job.modality === "audio" && file.name.toLowerCase().endsWith(".mp3")) {
      return `<div class="panel"><h3>${safeName}</h3><audio controls preload="none" src="${src}">Audio preview unsupported.</audio><p class="mu">Practice sample. Transcript note: use [unclear] rather than guessing.</p></div>`;
    }
    if (job.modality === "video" && file.name.toLowerCase().endsWith(".mp4")) {
      return `<div class="panel"><h3>${safeName}</h3><video controls preload="none" playsinline aria-label="Practice clip ${safeName}" src="${src}">Video preview unsupported.</video><p class="mu">Practice sample; no autoplay. Captions or transcript are not needed for these visual-labeling tasks; follow the written description.</p></div>`;
    }
    if (job.modality === "image" && /\.(png|jpe?g|webp)$/i.test(file.name)) {
      return `<div class="panel"><h3>${safeName}</h3><img class="project-preview-image" src="${src}" alt="Practice sample ${safeName}"></div>`;
    }
    return "";
  }).join("");
  const hours = Number.isFinite(progress.hours) ? progress.hours : 0.5;
  draw(`
    <button class="gh" data-act="back">Back to jobs</button>
    <h1>${esc(job.title)}</h1>
    <p class="mu">${esc(job.client)} · ${esc(job.modality)} practice pack</p>
    <div class="panel">
      <h2>Project brief</h2>
      <p><b>Issued:</b> ${esc(formatDate(progress.issuedAt))} · <b>Deadline:</b> ${esc(formatDeadline(progress.deadline))} (Africa/Kampala, EAT / UTC+3)</p>
      <p>${esc(job.detail)}</p>
      <h3>Labeling guidelines and edge cases</h3>
      <ul>${job.guidelines.map((rule) => `<li>${esc(rule)}</li>`).join("")}</ul>
      <h3>Allowed tools and export</h3><p>${job.tools.map(esc).join(", ")}</p><p>${esc(toolExportTip(job))}</p>
      <p><b>Deliverable:</b> ${esc(job.deliverable.format)} columns <code>${esc(job.deliverable.columns.join(", "))}</code></p>
      <h3>Pay rule</h3><p>Example values. Real platforms set their own. ${job.payModel.type === "hourly"
        ? `Practice money: $${job.payModel.rate.toFixed(2)} per accepted hour, capped at ${job.payModel.maxHours} hours.`
        : `Practice money: $${job.payModel.rate.toFixed(2)} per accepted task; rejected items are unpaid.`}</p>
    </div>
    <div class="panel">
      <h2>Downloads</h2>
      <p><button class="gh" data-act="download-brief" data-id="${job.id}">Download project brief (.txt)</button>
      <button class="gh" data-act="download-template" data-id="${job.id}">Download export template (.csv)</button>
      <button class="gh" data-act="download-example" data-id="${job.id}">Download example of a correct export (.csv)</button></p>
      ${resources.archive ? `<p><a class="pr" href="${esc(resources.archive)}" download>Download project pack (.zip)</a></p>` : '<p><button class="gh" type="button" disabled>Download project pack (.zip) — being prepared</button></p>'}
      ${mediaNotice}${links ? `<ul>${links}</ul>` : ""}${manifestError ? `<p class="no" role="alert">${esc(manifestError)}</p>` : ""}${previews}
    </div>
    <div class="panel">
      <h2>Submit your export</h2>
      <label class="f" for="hours-worked">Hours you worked (0.5 to ${job.payModel.maxHours}, steps of 0.5)</label>
      <input id="hours-worked" type="number" min="0.5" max="${job.payModel.maxHours}" step="0.5" value="${hours}">
      <p class="mu">${job.payModel.type === "hourly" ? "Hourly practice pay uses these hours, up to the maximum." : "Per-task practice pay is based on accepted tasks. Hours are recorded for the effective hourly rate."}</p>
      <label class="f" for="export-file">Completed CSV file</label>
      <input id="export-file" type="file" accept=".csv,text/csv">
      <p id="submission-status" class="mu" role="status" aria-live="polite">Required columns: ${esc(job.deliverable.columns.join(", "))}. Upload at least two task rows.</p>
      <p><button class="pr" data-act="submit-export" data-id="${job.id}">Submit completed CSV</button></p>
    </div>
  `);
}

function openWork(id) {
  const job = find(id);
  if (!job || !proposalProgress[id] || !proposalProgress[id].qualified) return board();
  return showProjectPack(job, proposalProgress[id]);
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
  if (records.length < 3) throw new Error("The CSV must contain a header and at least two task rows.");
  const headers = records[0].map((header) => header.trim().toLowerCase());
  const required = job.deliverable.columns.map((column) => column.toLowerCase());
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Missing required column${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`);
  if (required.some((header) => headers.lastIndexOf(header) !== headers.indexOf(header))) {
    throw new Error("A required column name appears more than once.");
  }
  const column = (name) => headers.indexOf(name.toLowerCase());
  const cell = (values, name) => values[column(name)]?.trim() || "";
  const expected = new Map(job.workItems.map((item) => [item.id, item]));
  const entries = [];
  for (const [index, values] of records.slice(1).entries()) {
    if (values.length !== headers.length) throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${headers.length}.`);
    const id = cell(values, job.deliverable.idColumn);
    if (!expected.has(id)) throw new Error(`Unknown task ID "${id}" on CSV row ${index + 2}.`);
    const entry = { id, line: index + 2, values };
    if (job.scoring.type === "classification") {
      entry.label = cell(values, "label");
      if (!job.scoring.labels.includes(entry.label)) throw new Error(`Invalid label "${entry.label}" on row ${entry.line}. Allowed labels: ${job.scoring.labels.join(", ")}.`);
    } else if (job.scoring.type === "ner") {
      entry.entity_text = cell(values, "entity_text");
      entry.type = cell(values, "type");
      if (!entry.entity_text) throw new Error(`Entity text is missing on CSV row ${entry.line}.`);
      if (!job.scoring.labels.includes(entry.type)) throw new Error(`Invalid entity type "${entry.type}" on row ${entry.line}. Use ${job.scoring.labels.join(", ")}.`);
    } else if (job.scoring.type === "bbox") {
      entry.label = cell(values, "label");
      if (!job.scoring.labels.includes(entry.label)) throw new Error(`Invalid box label "${entry.label}" on row ${entry.line}.`);
      for (const key of ["x", "y", "width", "height"]) {
        entry[key] = Number(cell(values, key));
        if (!Number.isFinite(entry[key]) || (key === "width" || key === "height") && entry[key] <= 0 || (key === "x" || key === "y") && entry[key] < 0) {
          throw new Error(`CSV row ${entry.line} has an invalid ${key} value; use non-negative pixels and positive width/height.`);
        }
      }
    } else if (job.scoring.type === "transcript") {
      entry.transcript = cell(values, "transcript");
      if (!entry.transcript) throw new Error(`Transcript is missing on CSV row ${entry.line}.`);
    } else if (job.scoring.type === "sound_events" || job.scoring.type === "video_segments") {
      entry.label = cell(values, "label");
      if (!job.scoring.labels.includes(entry.label)) throw new Error(`Invalid event label "${entry.label}" on row ${entry.line}.`);
      entry.start = Number(cell(values, "start_seconds"));
      entry.end = Number(cell(values, "end_seconds"));
      if (!Number.isFinite(entry.start) || !Number.isFinite(entry.end) || entry.start < 0 || entry.end <= entry.start) {
        throw new Error(`CSV row ${entry.line} has invalid start/end seconds; times must be numbers and end must be greater than start.`);
      }
    } else if (job.scoring.type === "rating") {
      entry.rating = Number(cell(values, "rating"));
      if (!Number.isInteger(entry.rating) || entry.rating < job.scoring.min || entry.rating > job.scoring.max) {
        throw new Error(`CSV row ${entry.line} has a bad rating; use a whole number from ${job.scoring.min} to ${job.scoring.max}.`);
      }
    }
    entries.push(entry);
  }

  const idCounts = new Map();
  entries.forEach((entry) => idCounts.set(entry.id, (idCounts.get(entry.id) || 0) + 1));
  for (const id of expected.keys()) {
    if (!idCounts.has(id)) throw new Error(`Missing task ID "${id}". Include every task in the template.`);
  }
  if (job.scoring.type !== "ner" && job.scoring.type !== "sound_events" && job.scoring.type !== "video_segments") {
    const duplicate = [...idCounts].find(([, count]) => count > 1);
    if (duplicate) throw new Error(`Task ID "${duplicate[0]}" appears more than once.`);
  }

  let score = 0;
  let acceptedItems = 0;
  let metrics = {};
  let feedback = [];
  if (job.scoring.type === "classification") {
    feedback = entries.map((entry) => {
      const item = expected.get(entry.id);
      const correct = entry.label === item.label;
      if (correct) { score += 1; acceptedItems += 1; }
      return { id: entry.id, text: item.text || item.id, submitted: entry.label, correct: item.label, accepted: correct };
    });
    score /= entries.length;
  } else if (job.scoring.type === "ner") {
    const target = job.workItems.flatMap((item) => item.entities.map((entity) => ({ id: item.id, ...entity })));
    const predicted = entries.map(({ id, entity_text, type }) => ({ id, entity_text, type }));
    const key = (entity) => `${entity.id}\u0000${entity.entity_text}\u0000${entity.type}`;
    const targetSet = new Set(target.map(key));
    const predictedSet = new Set(predicted.map(key));
    if (predictedSet.size !== predicted.length) throw new Error("Duplicate entity rows were found; keep each entity once.");
    const matches = predicted.filter((item) => targetSet.has(key(item))).length;
    const precision = predicted.length ? matches / predicted.length : 0;
    const recall = target.length ? matches / target.length : 0;
    const f1 = precision + recall ? 2 * precision * recall / (precision + recall) : 0;
    score = f1;
    acceptedItems = matches;
    metrics = { precision, recall, f1, matched: matches, predicted: predicted.length, reference: target.length };
    feedback = predicted.map((item) => ({ id: item.id, text: item.entity_text, submitted: item.type, correct: target.find((ref) => key(ref) === key(item))?.type || "No exact entity match", accepted: targetSet.has(key(item)) }));
  } else if (job.scoring.type === "bbox") {
    const iou = (a, b) => {
      const left = Math.max(a.x, b.x), top = Math.max(a.y, b.y);
      const right = Math.min(a.x + a.width, b.x + b.width), bottom = Math.min(a.y + a.height, b.y + b.height);
      const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
      const union = a.width * a.height + b.width * b.height - intersection;
      return union ? intersection / union : 0;
    };
    const used = new Set();
    feedback = entries.map((entry) => {
      const match = expected.get(entry.id);
      const overlap = entry.label === match.label ? iou(entry, match) : 0;
      const correct = overlap >= job.scoring.iou && !used.has(entry.id);
      if (correct) { score += 1; acceptedItems += 1; used.add(entry.id); }
      return { id: entry.id, text: entry.label, submitted: `IoU ${overlap.toFixed(2)}`, correct: `${match.label} box (IoU ≥ ${job.scoring.iou})`, accepted: correct };
    });
    score /= job.workItems.length;
    metrics = { matches: acceptedItems, expected: job.workItems.length };
  } else if (job.scoring.type === "transcript") {
    const wordErrorRate = (reference, submitted) => {
      const a = reference.toLowerCase().match(/[a-z0-9']+/g) || [];
      const b = submitted.toLowerCase().match(/[a-z0-9']+/g) || [];
      const row = Array.from({ length: b.length + 1 }, (_, index) => index);
      for (let i = 1; i <= a.length; i += 1) {
        let previous = row[0];
        row[0] = i;
        for (let j = 1; j <= b.length; j += 1) {
          const old = row[j];
          row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
          previous = old;
        }
      }
      return a.length ? row[b.length] / a.length : (b.length ? 1 : 0);
    };
    let totalWer = 0;
    feedback = entries.map((entry) => {
      const item = expected.get(entry.id), wer = wordErrorRate(item.transcript, entry.transcript);
      totalWer += wer;
      const correct = wer <= (job.scoring.maxWer || 0.25);
      if (correct) acceptedItems += 1;
      return { id: entry.id, text: item.transcript, submitted: entry.transcript, correct: item.transcript, accepted: correct, wer };
    });
    const averageWer = totalWer / entries.length;
    score = 1 - averageWer;
    metrics = { wer: averageWer, acceptedByWer: averageWer <= (job.scoring.maxWer || 0.25) };
  } else if (job.scoring.type === "sound_events" || job.scoring.type === "video_segments") {
    const used = new Set();
    feedback = entries.map((entry) => {
      const item = expected.get(entry.id);
      const intersection = Math.max(0, Math.min(entry.end, item.end) - Math.max(entry.start, item.start));
      const union = Math.max(entry.end, item.end) - Math.min(entry.start, item.start);
      const overlap = union ? intersection / union : 0;
      const key = `${entry.id}:${entry.label}`;
      const correct = entry.label === item.label && overlap >= job.scoring.overlap && !used.has(key);
      if (correct) { score += 1; acceptedItems += 1; used.add(key); }
      return { id: entry.id, text: item.label, submitted: `${entry.label} · ${entry.start}-${entry.end}s (${Math.round(overlap * 100)}% overlap)`, correct: `${item.label} · ${item.start}-${item.end}s`, accepted: correct };
    });
    score /= job.workItems.length;
    metrics = { matches: acceptedItems, expected: job.workItems.length };
  } else if (job.scoring.type === "rating") {
    feedback = entries.map((entry) => {
      const item = expected.get(entry.id);
      const correct = Math.abs(entry.rating - item.rating) <= 1;
      if (correct) { score += 1; acceptedItems += 1; }
      return { id: entry.id, text: item.text, submitted: String(entry.rating), correct: String(item.rating), accepted: correct };
    });
    score /= entries.length;
    metrics = { withinOnePoint: acceptedItems, total: entries.length };
  }
  const accepted = job.scoring.type === "transcript"
    ? metrics.wer <= (job.scoring.maxWer || 0.25)
    : score >= job.payModel.minAccuracy;
  return { score, feedback, metrics, acceptedItems, accepted, total: entries.length };
}

async function submitExport(id) {
  const job = find(id);
  const progress = proposalProgress[id];
  if (!job || !progress || !progress.qualified) return board();
  const status = document.getElementById("submission-status");
  const file = document.getElementById("export-file").files[0];
  if (!file) {
    status.textContent = "Choose your completed CSV export before submitting.";
    status.className = "no";
    return;
  }
  if (file.size > 1024 * 1024) {
    status.textContent = "This export is larger than 1 MB. Choose the project CSV, not a full dataset.";
    status.className = "no";
    return;
  }
  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
    status.textContent = "This project accepts CSV files only. Export as .csv and try again.";
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
  const hoursInput = document.getElementById("hours-worked");
  const hours = Number(hoursInput.value);
  if (!Number.isFinite(hours) || hours < 0.5 || hours > job.payModel.maxHours || Math.round(hours * 2) !== hours * 2) {
    status.textContent = `Enter hours from 0.5 to ${job.payModel.maxHours} in steps of 0.5.`;
    status.className = "no";
    return;
  }
  const result = await save({
    jobId: job.id, jobTitle: job.title, type: "practice_export",
    score: checked.score, total: checked.total, passed: checked.accepted,
  });
  const attempt = progress.submission ? progress.submission.attempt + 1 : 1;
  progress.hours = hours;
  progress.submission = {
    score: checked.score, feedback: checked.feedback, metrics: checked.metrics,
    acceptedItems: checked.acceptedItems, accepted: checked.accepted,
    saveResult: result, attempt, submittedAt: new Date(), qa: null, payment: null,
  };
  showSubmissionReceipt(job, progress);
}

function showWallet() {
  const earnings = wallet.history.filter((item) => item.type === "earning");
  const totalHours = earnings.reduce((sum, item) => sum + (item.hours || 0), 0);
  const totalNet = earnings.reduce((sum, item) => sum + (item.net || item.amount || 0), 0);
  const averageRate = totalHours ? totalNet / totalHours : 0;
  draw(`
    <button class="gh" data-act="back">Back to jobs</button>
    <h1>My earnings</h1>
    <p class="mu">Example values. Real platforms set their own. All amounts below are Practice money.</p>
    <div class="wallet-grid">
      <div class="panel"><b>Pending</b><p>${money(wallet.pending)}</p></div>
      <div class="panel"><b>Available</b><p>${money(wallet.available)}</p></div>
      <div class="panel"><b>Withdrawn</b><p>${money(wallet.withdrawn)}</p></div>
      <div class="panel"><b>Average effective hourly rate</b><p>${money(averageRate)}/hour</p></div>
    </div>
    <div class="panel">
      <h2>Payout</h2>
      <p>Example values. Real platforms set their own. Minimum withdrawal: ${money(PAY_CONFIG.minWithdrawalUSD)}. Flat withdrawal fee: ${money(PAY_CONFIG.withdrawalFeeUSD)}.</p>
      ${wallet.pending > 0 ? '<button class="pr" data-act="skip-payout">Skip to payout date (simulated)</button>' : ""}
      ${wallet.available >= PAY_CONFIG.minWithdrawalUSD
        ? '<button class="gh" data-act="withdraw">Request withdrawal</button>'
        : `<p class="mu">Available balance must reach ${money(PAY_CONFIG.minWithdrawalUSD)}.</p>`}
      ${!acct.pay ? '<p class="mu">Link a practice payout method in account setup before withdrawal.</p>' : `<p>Linked method: ${esc(acct.pay)}</p>`}
    </div>
    <div class="panel"><h2>History</h2>${wallet.history.length
      ? `<ul>${[...wallet.history].reverse().map((entry) => `<li>${esc(entry.jobTitle || entry.jobId)} · ${esc(formatDate(new Date(entry.date)))} · ${entry.type === "withdrawal" ? "Withdrawal" : "Earnings"}: ${money(entry.net ?? entry.amount)}${entry.status ? ` · ${esc(entry.status)}` : ""}</li>`).join("")}</ul>`
      : "<p>No practice earnings yet.</p>"}</div>
  `);
}

function showWithdrawal() {
  if (wallet.available < PAY_CONFIG.minWithdrawalUSD) return showWallet();
  if (!acct.pay) {
    pendingJob = "wallet";
    return setup();
  }
  draw(`
    <button class="gh" data-act="wallet">Back to My earnings</button>
    <h1>Review simulated withdrawal</h1>
    <p>Example values. Real platforms set their own.</p>
    <div class="panel">
      <p><b>Payout method:</b> ${esc(acct.pay)}</p>
      <p><b>Available:</b> ${money(wallet.available)}</p>
      <p><b>Example flat withdrawal fee:</b> ${money(PAY_CONFIG.withdrawalFeeUSD)}</p>
      <p><b>Practice money received:</b> ${money(Math.max(0, wallet.available - PAY_CONFIG.withdrawalFeeUSD))}</p>
      <button class="pr" data-act="confirm-withdrawal">Confirm simulated withdrawal</button>
    </div>
  `);
}

async function confirmWithdrawal() {
  if (!acct.pay || wallet.available < PAY_CONFIG.minWithdrawalUSD) return showWallet();
  const amount = wallet.available;
  const fee = Math.min(amount, PAY_CONFIG.withdrawalFeeUSD);
  const reference = `PRACTICE-${Date.now()}`;
  const record = {
    type: "withdrawal", jobId: "wallet", jobTitle: "My earnings",
    amount: amount - fee, fee, date: new Date().toISOString(), status: "Requested",
    reference, method: acct.pay,
  };
  wallet.available = 0;
  wallet.withdrawn += record.amount;
  wallet.history.push(record);
  persistWallet();
  await save({ type: "practice_withdrawal", amount: record.amount, currency: "USD", jobId: "wallet", payoutMethod: acct.pay });
  draw(`<h1>Withdrawal receipt</h1><div class="panel"><p><b>Practice reference:</b> ${esc(reference)}</p><p>${money(amount)} less ${money(fee)} fee; ${money(record.amount)} sent to ${esc(acct.pay)} in this simulation.</p><p>No real transfer was made.</p><button class="pr" data-act="wallet">Back to My earnings</button></div>`);
}

async function reviewSubmission(id) {
  const job = find(id);
  const progress = proposalProgress[id];
  const submission = progress && progress.submission;
  if (!job || !submission) return board();
  if (submission.qa) return submission.qa.accepted ? showPaymentRecord(job, progress) : showQaResult(job, progress);
  const accepted = Boolean(submission.accepted);
  const reviewedAt = new Date();
  const result = await save({
    jobId: job.id, jobTitle: job.title, type: "practice_qa",
    attempt: submission.attempt, score: submission.score, accepted,
  });
  submission.qa = { accepted, reviewedAt, saveResult: result };
  if (accepted && !wallet.history.some((entry) => entry.type === "earning" && entry.jobId === job.id)) {
    const hours = progress.hours || 0.5;
    const units = job.payModel.type === "hourly" ? Math.min(hours, job.payModel.maxHours) : submission.acceptedItems;
    const gross = job.payModel.rate * units;
    const fee = gross * PAY_CONFIG.platformFeePct / 100;
    const net = gross - fee;
    submission.payment = { hours, acceptedTasks: submission.acceptedItems, gross, fee, net };
    wallet.pending += net;
    wallet.history.push({
      type: "earning", jobId: job.id, jobTitle: job.title, amount: net, net, gross, fee,
      hours, acceptedTasks: submission.acceptedItems, date: reviewedAt.toISOString(), status: "Pending",
    });
    persistWallet();
    await save({
      jobId: job.id, jobTitle: job.title, type: "practice_payment",
      amount: net, currency: "USD", status: "pending",
    });
  }
  showQaResult(job, progress);
}

function showQaResult(job, progress) {
  const submission = progress.submission;
  const accepted = submission.qa.accepted;
  const percentage = Math.round(submission.score * 100);
  const metrics = submission.metrics || {};
  const metricSummary = metrics.f1 !== undefined
    ? `<p>NER precision ${(metrics.precision * 100).toFixed(0)}%, recall ${(metrics.recall * 100).toFixed(0)}%, F1 ${(metrics.f1 * 100).toFixed(0)}% (${metrics.matched} matches).</p>`
    : metrics.wer !== undefined
      ? `<p>Word error rate: ${(metrics.wer * 100).toFixed(1)}% (acceptance limit 25%).</p>`
      : metrics.matches !== undefined
        ? `<p>Matches: ${metrics.matches} of ${metrics.expected}.</p>`
        : "";
  draw(`
    <h1>${accepted ? "Work accepted" : "Corrections requested"}</h1>
    <p class="mu">Simulated quality review · attempt ${submission.attempt} · ${esc(formatDeadline(submission.qa.reviewedAt))} EAT / UTC+3</p>
    <div class="panel">
      <p><b>Quality score:</b> ${percentage}%</p>${metricSummary}
      <p><b>Decision:</b> ${accepted ? "Accepted — this meets the project’s scoring rule." : "Corrections requested — review the mismatched items and upload a corrected CSV."}</p>
      <p class="mu">${statusText(submission.qa.saveResult)} This is simulated practice feedback.</p>
      ${accepted
        ? `<button class="pr" data-act="payment" data-id="${job.id}">View payment record</button>`
        : `<button class="pr" data-act="work" data-id="${job.id}">Upload corrected CSV</button>`}
    </div>
    ${submission.feedback.map((item, index) => `<div class="panel">
      <p><b>${index + 1}. ${esc(item.id)} — ${esc(item.text)}</b></p>
      <p>Your entry: <span class="${item.accepted ? "ok" : "no"}">${esc(item.submitted)}</span></p>
      <p>Reference: <b>${esc(item.correct)}</b>${item.why ? `. ${esc(item.why)}` : ""}</p>
    </div>`).join("")}
  `);
}

function showPaymentRecord(job, progress) {
  const payment = progress.submission.payment;
  if (!payment) return showQaResult(job, progress);
  const effectiveHourly = payment.hours ? payment.net / payment.hours : 0;
  draw(`
    <h1>Payment record</h1>
    <p class="mu">Example values. Real platforms set their own. Every amount is Practice money; no real funds move.</p>
    <div class="panel">
      <h2>Earnings breakdown</h2>
      <table class="earnings-table"><tbody>
        <tr><th scope="row">Rate</th><td>${money(job.payModel.rate)} ${job.payModel.type === "hourly" ? "per hour" : "per accepted task"}</td></tr>
        <tr><th scope="row">Hours worked</th><td>${payment.hours}</td></tr>
        ${job.payModel.type === "perTask" ? `<tr><th scope="row">Accepted tasks</th><td>${payment.acceptedTasks}</td></tr>` : ""}
        <tr><th scope="row">Gross</th><td>${money(payment.gross)}</td></tr>
        <tr><th scope="row">Example platform fee (${PAY_CONFIG.platformFeePct}%)</th><td>−${money(payment.fee)}</td></tr>
        <tr><th scope="row">Net pending</th><td><b>${money(payment.net)}</b></td></tr>
        <tr><th scope="row">Effective hourly rate</th><td>${money(effectiveHourly)}/hour</td></tr>
      </tbody></table>
      <p>Status: Pending. Visit My earnings to simulate the payout date.</p>
      <button class="pr" data-act="wallet">My earnings</button>
      <button class="gh" data-act="offer" data-id="${job.id}">Back to project brief</button>
      <button class="gh" data-act="back">Back to jobs</button>
    </div>
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
const PRACTICE_STORAGE_KEY = "pda-practice-progress-v1";
const COUNTRIES = ["Uganda", "Democratic Republic of the Congo", "Kenya", "Rwanda", "Burundi", "South Sudan", "Tanzania", "Ethiopia", "Somalia", "Nigeria", "Ghana", "Other"];
const DOCS = ["Passport", "National ID card", "Driver’s licence", "Refugee ID or attestation", "Residence permit"];
const PAY = [
  { id: "PayPal", icon: "paypal.svg", links: [["Open PayPal", "https://www.paypal.com/"]] },
  { id: "Payoneer", icon: "payoneer.svg", links: [["Open Payoneer", "https://www.payoneer.com/"]] },
  { id: "Mastercard or Visa card", icons: [["mastercard.svg", "Mastercard"], ["visa.svg", "Visa"]], links: [["Open Mastercard", "https://www.mastercard.com/"], ["Open Visa", "https://www.visa.com/"]] },
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

function persistPracticeState() {
  if (!name && !pendingJob && !idState && !acct.phone && !acct.id && !acct.pay &&
      Object.keys(proposalProgress).length === 0) {
    try {
      sessionStorage.removeItem(PRACTICE_STORAGE_KEY);
    } catch (error) {
      console.error("Unable to clear empty practice progress from session storage.", error);
    }
    return;
  }
  const state = {
    name,
    acct: { phone: Boolean(acct.phone), id: Boolean(acct.id), pay: Boolean(acct.pay) },
    paymentMethod: acct.pay || "",
    identity: {
      step: idState ? idState.s : null,
      country: idState ? idState.country : "",
      documentType: idState ? idState.doc : "",
      front: Boolean(idState && idState.front),
      back: Boolean(idState && idState.back),
    },
    pendingJob,
    proposalProgress: Object.fromEntries(Object.entries(proposalProgress).map(([id, progress]) => {
      if (!progress || typeof progress !== "object") return [id, progress];
      const safeProgress = { ...progress };
      if (safeProgress.submission) {
        safeProgress.submission = { ...safeProgress.submission, feedback: [] };
      }
      return [id, safeProgress];
    })),
  };
  try {
    sessionStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Unable to save practice progress in session storage.", error);
  }
}

function restorePracticeState() {
  let saved;
  try {
    const raw = sessionStorage.getItem(PRACTICE_STORAGE_KEY);
    if (raw === null) return gate();
    saved = JSON.parse(raw);
  } catch (error) {
    console.error("Unable to restore practice progress from session storage.", error);
    return gate();
  }

  if (!saved || typeof saved !== "object") return gate();
  name = typeof saved.name === "string" ? saved.name : "";
  acct.phone = saved.acct && saved.acct.phone === true;
  acct.id = saved.acct && saved.acct.id === true;
  const paymentMethod = typeof saved.paymentMethod === "string"
    ? saved.paymentMethod
    : saved.acct && typeof saved.acct.pay === "string" ? saved.acct.pay : "";
  acct.pay = saved.acct && saved.acct.pay === true && PAY.some((method) => method.id === paymentMethod)
    ? paymentMethod
    : saved.acct && typeof saved.acct.pay === "string" && PAY.some((method) => method.id === saved.acct.pay)
      ? saved.acct.pay
      : "";
  pendingJob = typeof saved.pendingJob === "string" && (find(saved.pendingJob) || saved.pendingJob === "wallet") ? saved.pendingJob : null;

  const identity = saved.identity;
  if (!acct.id && identity && Number.isInteger(identity.step) && identity.step >= 1 && identity.step <= 6) {
    idState = {
      s: identity.step,
      country: COUNTRIES.includes(identity.country) ? identity.country : "",
      doc: DOCS.includes(identity.documentType) ? identity.documentType : "",
      front: identity.front === true ? "Image selected" : "",
      back: identity.back === true ? "Image selected" : "",
    };
  }

  if (saved.proposalProgress && typeof saved.proposalProgress === "object") {
    Object.entries(saved.proposalProgress).forEach(([id, progress]) => {
      const job = find(id);
      if (!job || !progress || typeof progress !== "object") return;
      proposalProgress[id] = progress;
      ["issuedAt", "deadline"].forEach((key) => {
        if (progress[key]) progress[key] = new Date(progress[key]);
      });
      const submission = progress.submission;
      if (submission && typeof submission === "object") {
        if (submission.submittedAt) submission.submittedAt = new Date(submission.submittedAt);
        if (submission.qa && submission.qa.reviewedAt) submission.qa.reviewedAt = new Date(submission.qa.reviewedAt);
      }
    });
  }

  if (!name) return gate();
  if (idState) return idView();
  if (pendingJob) return setup();
  board();
}

function gateJob(id) {
  if (!find(id)) return board();
  if (acct.phone && acct.id && acct.pay) return openJob(id);
  pendingJob = id;
  persistPracticeState();
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
      <p>${st(!!acct.pay)} <b>Payment method</b>${acct.pay ? ` (${esc(acct.pay)}) <button class="gh" data-x="paychange">Change payment method</button>` : ' <button class="gh" data-x="paygo">Choose method</button>'}</p>
    </div>
    ${ready ? '<p><button class="pr" data-x="jobgo">Continue to the job</button></p>' : '<p class="mu">Finish all three steps to unlock jobs.</p>'}`);
}

function idView() {
  const s = idState;
  const h = (title, body) => draw(`<button class="gh" data-act="back">Cancel</button><h1>Identity verification</h1>
    <p class="mu">Practice mode. Nothing is uploaded. Progress is saved for this tab only.</p><div class="panel"><h2>${title}</h2>${body}</div>`);
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
      <label class="f" for="fl">Or choose any harmless image (maximum 25 MB)</label><input id="fl" type="file" accept="image/*">
      <p class="mu">On your phone, choose a saved photo or a file. If your browser closes when you open the camera, come back and choose a saved photo, or use 'Use a sample document'.</p>
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
    <div class="payment-options" role="group" aria-label="Choose a payment method">${PAY.map((x) => `<button type="button" class="gh payment-option" data-x="paypick" data-m="${x.id}" aria-pressed="${x.id === m}">${x.icons ? `<span class="payment-logo-set">${x.icons.map(([icon, alt]) => `<span class="payment-logo-tile"><img class="payment-icon" src="assets/payments/${icon}" alt="${esc(alt)} logo"></span>`).join("")}</span>` : `<span class="payment-logo-tile"><img class="payment-icon" src="assets/payments/${x.icon}" alt="${esc(x.id)} logo"></span>`}<span>${esc(x.id)}</span></button>`).join("")}</div>
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
  inp.value = "";
  gid("chat").querySelector(".chatq").classList.add("hidden");
  chatAdd("me", t);
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
  gid("chat").classList.toggle("chat-open", open);
  gid("chat-launcher").setAttribute("aria-expanded", String(open));
  if (open) {
    gid("chat-unread").classList.add("hidden");
    gid("chatin").focus();
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
  gid("chat").classList.remove("chat-open");
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
  if (file.size > 25 * 1024 * 1024) {
    status.textContent = "That image is larger than 25 MB. Choose a smaller image.";
    status.className = "no";
    input.value = "";
    return;
  }
  idState[side] = "Image selected";
  status.textContent = "Image selected";
  status.className = "mu";
  next.classList.remove("hidden");
  persistPracticeState();
  input.value = "";
});

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-x]");
  if (!b) return;
  const x = b.dataset.x, s = idState;
  if (x === "wallet-reset") {
    resetPracticeData();
  } else if (x === "mclose") modal("");
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
  else if (x === "idfin") { acct.id = true; idState = null; setup(); }
  else if (x === "paygo") payView();
  else if (x === "paychange") { acct.pay = ""; payView(); }
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
      const error = gid("pay-error");
      error.textContent = "For your safety, this practice site only accepts sample numbers.";
      if (!futureExpiry) {
        error.textContent = "Expiry must be a future date.";
        error.classList.remove("hidden");
        return;
      }
      const valid = gid("cardholder").value.trim() && ["4242424242424242", "5555555555554444"].includes(card) && futureExpiry && gid("cardcvc").value === "123";
      if (!valid) { error.classList.remove("hidden"); return; }
    } else if (b.dataset.m === "Bank account") {
      const valid = gid("bankname").value.trim() && gid("accountholder").value.trim() && gid("accountnumber").value === "0123456789" && gid("swift").value.trim();
      if (!valid) { gid("pay-error").classList.remove("hidden"); return; }
    }
    acct.pay = b.dataset.m; toast("Payment method linked (practice)."); setup();
  }   else if (x === "jobgo") { const jobId = pendingJob; pendingJob = null; openJob(jobId); }
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
    pendingJob = null;
    idState = null;
    filter = "all";
    modalityFilter = "all";
    visibleJobCount = 6;
    Object.keys(proposalProgress).forEach((jobId) => delete proposalProgress[jobId]);
    gate();
    return;
  }

  if (action === "filter") {
    filter = id;
    visibleJobCount = 6;
    board();
    return;
  }

  if (action === "modality-filter") {
    modalityFilter = id;
    visibleJobCount = 6;
    board();
    return;
  }

  if (action === "see-more") {
    visibleJobCount = Math.min(visibleJobCount + 6, JOBS.length);
    board();
    return;
  }

  if (action === "back") {
    pendingJob = null;
    idState = null;
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

  if (action === "wallet") {
    showWallet();
    return;
  }

  if (action === "skip-payout") {
    wallet.available += wallet.pending;
    wallet.pending = 0;
    wallet.history.forEach((entry) => {
      if (entry.type === "earning" && entry.status === "Pending") entry.status = "Available";
    });
    persistWallet();
    showWallet();
    return;
  }

  if (action === "withdraw") {
    showWithdrawal();
    return;
  }

  if (action === "confirm-withdrawal") {
    confirmWithdrawal();
    return;
  }

  if (action === "download-brief") {
    const job = find(id);
    const progress = proposalProgress[id];
    if (job && job.workItems && progress && progress.qualified) {
      downloadFile(`${job.id}-project-brief.txt`, projectBrief(job, progress), "text/plain;charset=utf-8");
    }
    return;
  }

  if (action === "download-template") {
    const job = find(id);
    if (job && job.workItems && proposalProgress[id] && proposalProgress[id].qualified) {
      downloadFile(`${job.id}-${job.deliverable.template}`, projectCsv(job), "text/csv;charset=utf-8");
    }
    return;
  }

  if (action === "download-example") {
    const job = find(id);
    if (job && proposalProgress[id] && proposalProgress[id].qualified) {
      downloadFile(`${job.id}-correct-example.csv`, projectCsv(job, true), "text/csv;charset=utf-8");
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

addWalletControls();
chatInit();
restorePracticeState();
initFirebase();