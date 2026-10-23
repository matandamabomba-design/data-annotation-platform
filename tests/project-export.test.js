const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const appPath = path.join(__dirname, "..", "app.js");
const source = fs.readFileSync(appPath, "utf8");
const jobsStart = source.indexOf("const LABELS =");
const jobsEnd = source.indexOf("\nconst GUIDE =", jobsStart);
const exportStart = source.indexOf("function csvCell(");
const exportEnd = source.indexOf("function downloadFile(", exportStart);
const zipStart = source.indexOf("function crc32(", exportEnd);
const zipEnd = source.indexOf("\nconst formatDate =", zipStart);
const validationStart = source.indexOf("function parseCsv(", exportEnd);
const validationEnd = source.indexOf("async function submitExport(", validationStart);
const context = { TextEncoder, TextDecoder, Uint8Array, DataView };

assert.ok(jobsStart >= 0 && jobsEnd > jobsStart, "job data must exist");
assert.ok(exportStart >= 0 && exportEnd > exportStart, "project CSV export helpers must exist");
assert.ok(zipStart >= 0 && zipEnd > zipStart, "the stored ZIP writer must exist");
assert.ok(validationStart >= 0 && validationEnd > validationStart, "CSV validation helpers must exist");
vm.runInNewContext(
  `${source.slice(jobsStart, jobsEnd)}\n${source.slice(exportStart, exportEnd)}\n${source.slice(zipStart, zipEnd)}\n` +
    `${source.slice(validationStart, validationEnd)}\n` +
    "globalThis.jobs = JOBS; globalThis.projectCsv = projectCsv; " +
    "globalThis.valuesForExport = valuesForExport; globalThis.csvCell = csvCell; " +
    "globalThis.parseCsv = parseCsv; globalThis.validateProjectExport = validateProjectExport; " +
    "globalThis.storedZip = storedZip; globalThis.crc32 = crc32;",
  context
);

function csvFromRows(rows) {
  return rows.map((row) => Array.from(row, context.csvCell).join(",")).join("\r\n");
}

function correctReferenceCsv(job) {
  const rows = [
    job.deliverable.columns,
    ...job.workItems.flatMap((item) => context.valuesForExport(job, item, true)),
  ];
  return csvFromRows(rows);
}

test("every text batch exports 12 source rows, two safe examples, and scores correct work", () => {
  const textJobs = Array.from(context.jobs).filter((job) => job.modality === "text" && !job.scam);
  assert.equal(textJobs.length, 9);

  for (const job of textJobs) {
    const templateRows = context.parseCsv(context.projectCsv(job));
    assert.deepEqual(Array.from(templateRows[0]), Array.from(job.deliverable.columns), `${job.id} headers`);
    assert.equal(templateRows.length - 1, 12, `${job.id} template batch size`);
    assert.equal(job.qualification.items.length, 5, `${job.id} qualification length`);
    for (const sourceColumn of job.sourceColumns || []) {
      const sourceIndex = job.deliverable.columns.indexOf(sourceColumn);
      assert.ok(templateRows.slice(1).every((row) => row[sourceIndex]), `${job.id} has source content in ${sourceColumn}`);
    }

    const exampleRows = context.parseCsv(context.projectCsv(job, true));
    assert.deepEqual(Array.from(exampleRows.slice(1).map((row) => row[0])), ["EX-001", "EX-002"], `${job.id} example IDs`);
    assert.throws(() => context.validateProjectExport(job, context.projectCsv(job, true)), /is not part of this batch/);

    const correct = context.validateProjectExport(job, correctReferenceCsv(job));
    assert.equal(correct.score, 1, `${job.id} correct reference score`);
    assert.equal(correct.accepted, true, `${job.id} correct reference decision`);
    if (job.id === "t2") {
      assert.equal(correct.metrics.precision, 1);
      assert.equal(correct.metrics.recall, 1);
      assert.equal(correct.metrics.f1, 1);
    }
  }
});

test("a different project export and changed source text are rejected", () => {
  const jobs = Array.from(context.jobs);
  const firstIntent = jobs.find((job) => job.id === "t1");
  const scamMessages = jobs.find((job) => job.id === "t4");
  assert.throws(
    () => context.validateProjectExport(scamMessages, correctReferenceCsv(firstIntent)),
    /is not part of this batch/
  );

  const sourceChanged = context.parseCsv(correctReferenceCsv(firstIntent)).map((row) => Array.from(row));
  sourceChanged[1][firstIntent.deliverable.columns.indexOf("message")] = "Altered supplied text";
  assert.throws(
    () => context.validateProjectExport(firstIntent, csvFromRows(sourceChanged)),
    /Source text .* was changed/
  );
});

test("all media templates use manifest filenames and references remain unconfigured", () => {
  const expectedColumns = {
    i1: ["file", "label"],
    i2: ["image", "label", "x", "y", "width", "height"],
    i3: ["file", "label"],
    i4: ["file", "transcript"],
    a1: ["clip_id", "transcript"],
    a2: ["clip_id", "label"],
    a3: ["clip_id", "label", "start_seconds", "end_seconds"],
    v1: ["clip_id", "label"],
    v2: ["clip_id", "label", "start_seconds", "end_seconds"],
    v3: ["clip_id", "label"],
  };
  const jobs = Array.from(context.jobs);
  assert.equal(jobs.length, 20);

  for (const [id, columns] of Object.entries(expectedColumns)) {
    const job = jobs.find((candidate) => candidate.id === id);
    const directory = path.join(__dirname, "..", "assets", "projects", id);
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, "manifest.json"), "utf8"));
    const reference = JSON.parse(fs.readFileSync(path.join(directory, "reference.json"), "utf8"));
    const filenames = manifest.files.map((entry) => typeof entry === "string" ? entry : entry.path);
    const rows = context.parseCsv(context.projectCsv(job, false, filenames));

    assert.deepEqual(Array.from(job.deliverable.columns), columns, `${id} columns`);
    assert.deepEqual(Array.from(rows[0]), columns, `${id} exported headers`);
    assert.deepEqual(Array.from(rows.slice(1).map((row) => row[0])), filenames, `${id} manifest IDs`);
    assert.equal(reference.status, "not_configured", `${id} reference status`);
    assert.deepEqual(Array.from(reference.answers), [], `${id} reference answers`);
  }
});

test("stored ZIP output contains three valid uncompressed files", () => {
  const files = [
    ["project-brief.txt", "brief contents"],
    ["export-template.csv", "task_id,label\r\nT-001,"],
    ["example-export.csv", "task_id,label\r\nEX-001,Positive"],
  ];
  const bytes = Uint8Array.from(context.storedZip(files));
  const view = new DataView(bytes.buffer);
  const endOffset = bytes.length - 22;
  assert.equal(view.getUint32(endOffset, true), 0x06054b50);
  const entryCount = view.getUint16(endOffset + 10, true);
  let offset = view.getUint32(endOffset + 16, true);
  const extracted = [];
  for (let index = 0; index < entryCount; index += 1) {
    assert.equal(view.getUint32(offset, true), 0x02014b50);
    assert.equal(view.getUint16(offset + 10, true), 0, "entries are stored without compression");
    const checksum = view.getUint32(offset + 16, true);
    const size = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    const localOffset = view.getUint32(offset + 42, true);
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const content = bytes.slice(dataStart, dataStart + size);
    assert.equal(context.crc32(content), checksum, `${name} CRC`);
    extracted.push([name, new TextDecoder().decode(content)]);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  assert.deepEqual(extracted, files);
});

test("video no_event rows use blank timestamps and participate in scoring", () => {
  const sourceJob = Array.from(context.jobs).find((job) => job.id === "v2");
  const job = {
    ...sourceJob,
    workItems: [{ id: "clip-01.mp4" }, { id: "clip-02.mp4" }],
    referenceAnswers: [
      { id: "clip-01.mp4", label: "no_event" },
      { id: "clip-02.mp4", label: "person_waves", start: 1, end: 2 },
    ],
  };
  const csv = [
    job.deliverable.columns,
    ["clip-01.mp4", "no_event", "", ""],
    ["clip-02.mp4", "person_waves", "1", "2"],
  ];
  const result = context.validateProjectExport(job, csvFromRows(csv));

  assert.equal(result.score, 1);
  assert.equal(result.accepted, true);
  assert.throws(
    () => context.validateProjectExport(job, csvFromRows([
      job.deliverable.columns,
      ["clip-01.mp4", "no_event", "0", "1"],
      ["clip-02.mp4", "person_waves", "1", "2"],
    ])),
    /leave start_seconds and end_seconds blank/
  );
});

test("three wrong annotations fall below the pass mark and request corrections", () => {
  const textJobs = Array.from(context.jobs).filter((job) => job.modality === "text" && !job.scam);
  for (const job of textJobs) {
    const parsed = context.parseCsv(correctReferenceCsv(job)).map((row) => Array.from(row));
    if (job.scoring.type === "classification") {
      const labelIndex = job.deliverable.columns.indexOf("label");
      for (const row of parsed.slice(1, 4)) row[labelIndex] = job.scoring.labels.find((label) => label !== row[labelIndex]);
    } else if (job.scoring.type === "rating") {
      const ratingIndex = job.deliverable.columns.indexOf("rating");
      for (const row of parsed.slice(1, 4)) row[ratingIndex] = String(Number(row[ratingIndex]) === 5 ? 1 : 5);
    } else {
      const changedIds = new Set();
      const idIndex = job.deliverable.columns.indexOf("task_id");
      const entityIndex = job.deliverable.columns.indexOf("entity_text");
      for (const row of parsed.slice(1)) {
        if (!changedIds.has(row[idIndex]) && row[entityIndex] !== "NONE") {
          row[entityIndex] = `Wrong-${row[idIndex]}`;
          changedIds.add(row[idIndex]);
          if (changedIds.size === 5) break;
        }
      }
    }
    const result = context.validateProjectExport(job, csvFromRows(parsed));
    assert.ok(result.score < 0.8, `${job.id} score is below threshold`);
    assert.equal(result.accepted, false, `${job.id} requests corrections`);
  }
});

test("quality review displays NER metrics and offers correction resubmission", () => {
  const start = source.indexOf("function showQaResult(");
  const end = source.indexOf("\nfunction showPaymentRecord(", start);
  const context = {
    draw: (html) => { context.html = html; },
    esc: (value) => String(value),
    formatDeadline: () => "practice date",
    statusText: () => "Practice result",
  };
  vm.runInNewContext(`${source.slice(start, end)}\nglobalThis.showQaResult = showQaResult;`, context);

  context.showQaResult({
    id: "t2",
    title: "Entity labeling",
  }, {
    submission: {
      score: 0.75,
      attempt: 1,
      metrics: { precision: 0.75, recall: 0.75, f1: 0.75, matched: 15 },
      acceptedItems: 15,
      qa: { accepted: false, reviewedAt: new Date(), saveResult: {} },
      feedback: [],
    },
  });
  assert.match(context.html, /Corrections requested/);
  assert.match(context.html, /NER precision 75%, recall 75%, F1 75%/);
  assert.match(context.html, /data-act="work"/);
  assert.match(context.html, /Upload corrected CSV/);
});
