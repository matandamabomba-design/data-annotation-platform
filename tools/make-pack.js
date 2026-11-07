#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function loadJobs() {
  const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const start = source.indexOf("const LABELS =");
  const end = source.indexOf("\nconst GUIDE =", start);
  if (start < 0 || end < start) throw new Error("Could not find JOBS definitions in app.js.");
  const context = { TextEncoder, TextDecoder, Uint8Array, DataView };
  vm.runInNewContext(source.slice(start, end) + "\nglobalThis.jobs=JOBS;", context);
  return Array.from(context.jobs);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell.trim());
    if (row.some((value) => value !== "")) rows.push(row);
  }
  return rows;
}

function jpegSizeAndGps(buffer) {
  let width = 0;
  let gps = false;
  let offset = 2;
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return { width, gps };
  while (offset + 3 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    const segmentStart = offset + 2;
    if (marker === 0xe1 && length >= 8) {
      if (buffer.toString("ascii", segmentStart, segmentStart + 6) === "Exif\0\0") {
        const tif = segmentStart + 6;
        if (tif + 8 <= buffer.length) {
          const little = buffer.toString("ascii", tif, tif + 2) === "II";
          const read16 = (pos) => little ? buffer.readUInt16LE(pos) : buffer.readUInt16BE(pos);
          const read32 = (pos) => little ? buffer.readUInt32LE(pos) : buffer.readUInt32BE(pos);
          if (read16(tif + 2) === 0x002a) {
            const ifd0 = tif + read32(tif + 4);
            if (ifd0 >= tif && ifd0 + 2 <= segmentStart + length - 2) {
              const count = read16(ifd0);
              for (let i = 0; i < count && ifd0 + 2 + i * 12 + 12 <= buffer.length; i += 1) {
                const entry = ifd0 + 2 + i * 12;
                if (read16(entry) === 0x8825) gps = true;
              }
            }
          }
        }
      }
    }
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      if (segmentStart + 7 <= buffer.length) {
        width = buffer.readUInt16BE(segmentStart + 3);
      }
    }
    offset += length;
  }
  return { width, gps };
}

function crc32(buffer) {
  return checksum(buffer);
}

function crc32Table() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
}
const CRC_TABLE = crc32Table();
function checksum(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function uint16(value) { const b = Buffer.alloc(2); b.writeUInt16LE(value); return b; }
function uint32(value) { const b = Buffer.alloc(4); b.writeUInt32LE(value); return b; }

function makeStoredZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const crc = checksum(entry.data);
    const local = Buffer.concat([
      uint32(0x04034b50), uint16(20), uint16(0x0800), uint16(0), uint16(0), uint16(0),
      uint32(crc), uint32(entry.data.length), uint32(entry.data.length), uint16(name.length), uint16(0),
      name, entry.data
    ]);
    localParts.push(local);
    const central = Buffer.concat([
      uint32(0x02014b50), uint16(20), uint16(20), uint16(0x0800), uint16(0), uint16(0),
      uint16(0), uint32(crc), uint32(entry.data.length), uint32(entry.data.length),
      uint16(name.length), uint16(0), uint16(0), uint16(0), uint16(0), uint32(0), uint32(offset),
      name
    ]);
    centralParts.push(central);
    offset += local.length;
  }
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.concat([
    uint32(0x06054b50), uint16(0), uint16(0), uint16(entries.length), uint16(entries.length),
    uint32(centralDirectory.length), uint32(offset), uint16(0)
  ]);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

function isNumber(value) {
  if (value.trim() === "") return false;
  const number = Number(value);
  return Number.isFinite(number);
}

function makeReference(job, media, csvText) {
  const rows = parseCsv(csvText);
  if (!rows.length) throw new Error("Answers CSV is empty.");
  const headers = rows[0].map((value) => value.trim());
  const expectedId = job.deliverable.idColumn;
  const type = job.scoring.type;
  const expected = type === "classification" ? [expectedId, "label"]
    : type === "transcript" ? [expectedId, "transcript"]
    : type === "bbox" ? ["image", "label", "x", "y", "width", "height"]
    : type === "sound_events" ? ["clip_id", "label", "start_seconds", "end_seconds"]
    : type === "video_segments" ? ["clip_id", "label", "start_seconds", "end_seconds"]
    : null;
  if (!expected) throw new Error(`Unsupported scoring type: ${type}`);
  if (headers.length !== expected.length || expected.some((value, index) => headers[index] !== value)) {
    throw new Error(`Expected CSV columns: ${expected.join(",")}`);
  }
  const idIndex = headers.indexOf(expectedId);
  const labelIndex = headers.indexOf("label");
  const allowed = new Set(job.scoring.labels || []);
  const answers = [];
  const seen = new Set();
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (row.length !== headers.length) throw new Error(`CSV row ${rowIndex + 1} has the wrong number of columns.`);
    const id = row[idIndex];
    if (!media.some((file) => file.name === id)) throw new Error(`CSV file "${id}" does not exist in this job's media folder.`);
    seen.add(id);
    if (labelIndex >= 0) {
      const label = row[labelIndex];
      if (!allowed.has(label)) throw new Error(`Label "${label}" is not allowed for ${job.id}.`);
    }
    if (type === "classification") {
      if (expectedId === "clip_id") answers.push({ clip_id: id, label: row[labelIndex] });
      else answers.push({ file: id, label: row[labelIndex] });
    } else if (type === "transcript") {
      answers.push(job.id === "i4" ? { file: id, transcript: row[headers.indexOf("transcript")] } : { clip_id: id, transcript: row[headers.indexOf("transcript")] });
    } else if (type === "bbox") {
      const values = ["x", "y", "width", "height"].map((column) => row[headers.indexOf(column)]);
      if (!values.every(isNumber)) throw new Error(`Invalid box number in CSV row ${rowIndex + 1}.`);
      const [x, y, width, height] = values.map(Number);
      if ([x, y, width, height].some((value) => !Number.isFinite(value)) || x < 0 || y < 0 || width <= 0 || height <= 0) throw new Error(`Invalid box number in CSV row ${rowIndex + 1}.`);
      answers.push({ image: id, label: row[labelIndex], x, y, width, height });
    } else {
      const start = row[headers.indexOf("start_seconds")];
      const end = row[headers.indexOf("end_seconds")];
      if (!isNumber(start) || !isNumber(end)) throw new Error(`Invalid start_seconds or end_seconds in CSV row ${rowIndex + 1}.`);
      const startValue = Number(start);
      const endValue = Number(end);
      if (startValue < 0 || endValue <= startValue) throw new Error(`Invalid event interval in CSV row ${rowIndex + 1}.`);
      answers.push({ clip_id: id, label: row[labelIndex], start_seconds: startValue, end_seconds: endValue });
    }
  }
  for (const file of media) {
    if (!seen.has(file.name)) throw new Error(`Media file "${file.name}" has no answer row.`);
  }
  return { jobId: job.id, status: "configured", answers };
}

function run(jobId, answersPath) {
  const jobs = loadJobs();
  const job = jobs.find((candidate) => candidate.id === jobId);
  if (!job) throw new Error(`Unknown jobId "${jobId}". Available media IDs are i1-i4 and a1-a3 and v1-v3.`);
  if (!["image", "audio", "video"].includes(job.modality)) throw new Error(`Job "${jobId}" is text-only and does not use a media pack.`);
  const projectDir = path.join(root, "assets", "projects", jobId);
  fs.mkdirSync(projectDir, { recursive: true });
  const extensions = job.modality === "image" ? [".jpg"] : job.modality === "audio" ? [".mp3"] : [".mp4"];
  const files = fs.readdirSync(projectDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extensions.includes(path.extname(entry.name).toLowerCase()))
    .map((entry) => ({ name: entry.name, full: path.join(projectDir, entry.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const problems = [];
  const warnings = [];
  const zipEntries = [];
  for (const file of files) {
    const buffer = fs.readFileSync(file.full);
    zipEntries.push({ name: file.name, data: buffer });
    if (job.modality === "image") {
      const info = jpegSizeAndGps(buffer);
      if (buffer.length > 300 * 1024) problems.push(`Image "${file.name}" is ${buffer.length} bytes; limit is 300 KB.`);
      if (info.width > 1600) problems.push(`Image "${file.name}" is ${info.width}px wide; limit is 1600 px.`);
      if (info.gps) warnings.push(`Image "${file.name}" contains EXIF GPS data. Re-save without metadata.`);
    } else if (job.modality === "audio" && buffer.length > 1024 * 1024) {
      problems.push(`Audio "${file.name}" is ${buffer.length} bytes; limit is 1 MB.`);
    } else if (job.modality === "video" && buffer.length > 5 * 1024 * 1024) {
      problems.push(`Video "${file.name}" is ${buffer.length} bytes; limit is 5 MB.`);
    }
    if (job.modality === "audio") warnings.push(`MP3 "${file.name}": remove metadata with ffmpeg -map_metadata -1.`);
    if (job.modality === "video") warnings.push(`MP4 "${file.name}": remove metadata with ffmpeg -map_metadata -1.`);
  }
  if (!files.length) problems.push(`No ${job.modality} media files were found in assets/projects/${jobId}/.`);

  const manifest = {
    jobId,
    archive: { path: "pack.zip", available: files.length > 0 },
    files: files.map((file) => ({ path: file.name, available: true }))
  };
  fs.writeFileSync(path.join(projectDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  fs.writeFileSync(path.join(projectDir, "pack.zip"), makeStoredZip(zipEntries));

  if (answersPath) {
    const answersText = fs.readFileSync(path.resolve(answersPath), "utf8");
    const reference = makeReference(job, files, answersText);
    fs.writeFileSync(path.join(projectDir, "reference.json"), JSON.stringify(reference, null, 2) + "\n");
  } else if (!fs.existsSync(path.join(projectDir, "reference.json"))) {
    fs.writeFileSync(path.join(projectDir, "reference.json"), JSON.stringify({ jobId, status: "not_configured", answers: [] }, null, 2) + "\n");
  }

  for (const warning of warnings) console.log(`WARNING: ${warning}`);
  for (const problem of problems) console.log(`PROBLEM: ${problem}`);
  console.log(`Final summary: ${jobId} has ${files.length} ${job.modality} file(s), manifest.json updated, and pack.zip rebuilt.`);
  console.log("Checklist: Verify board badge/button, open the pack page, test downloads and previews, submit the template with correct labels, then test three wrong rows for corrections.");
  if (problems.length) process.exitCode = 2;
}

if (require.main === module) {
  const [jobId, answersCsv] = process.argv.slice(2);
  if (!jobId) {
    console.error("Usage: node tools/make-pack.js <jobId> [answers.csv]");
    process.exit(1);
  }
  try {
    run(jobId, answersCsv);
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

module.exports = { loadJobs, parseCsv, jpegSizeAndGps, makeStoredZip, checksum, makeReference, run };
