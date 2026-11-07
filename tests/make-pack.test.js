const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const tool = require("../tools/make-pack.js");

test("pack tool loads all job definitions and validates allowed labels", () => {
  const jobs = tool.loadJobs();
  assert.equal(jobs.length, 20);
  const i1 = jobs.find((job) => job.id === "i1");
  assert.deepEqual(Array.from(i1.scoring.labels), ["animals", "vehicles", "food", "buildings"]);

  const media = [{ name: "image-01.jpg" }];
  assert.throws(
    () => tool.makeReference(i1, media, "file,label\r\nimage-01.jpg,not_a_label\r\n"),
    /not allowed/
  );
  assert.throws(
    () => tool.makeReference(i1, media, "file,label\r\nmissing.jpg,animals\r\n"),
    /does not exist/
  );
});

test("pack tool builds a flat stored ZIP with CRC32 entries", () => {
  const zip = tool.makeStoredZip([
    { name: "image-01.jpg", data: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) },
    { name: "image-02.jpg", data: Buffer.from("sample") },
  ]);
  assert.equal(zip.readUInt32LE(zip.length - 22), 0x06054b50);
  assert.equal(zip.readUInt16LE(zip.length - 12), 2);
  assert.equal(zip.readUInt16LE(8), 0, "local entries should be stored without compression");
});

test("JPEG header parser reads SOF width", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x02, 0xd0, 0x06, 0x40, 0xff, 0xd9]);
  const info = tool.jpegSizeAndGps(jpeg);
  assert.equal(info.width, 1600);
});

test("pack tool refuses missing answer coverage", () => {
  const jobs = tool.loadJobs();
  const i3 = jobs.find((job) => job.id === "i3");
  assert.throws(
    () => tool.makeReference(i3, [{ name: "image-02.jpg" }, { name: "image-04.jpg" }], "file,label\r\nimage-02.jpg,ok\r\n"),
    /has no answer row/
  );
});
