# Project pack assets

Matanda: add only media that you own or are authorized to use. Never add identifiable faces, minors, or personal data. Use public-domain media or your own media; recordings require written consent from every identifiable voice.

| Job | Exact files to add | Per-file limit and source requirement |
| --- | --- | --- |
| j1 Label customer reviews | No files to add; pack is generated in the browser. | Locally authored sample data only; no personal data. |
| j2 Scam listing | No project pack or manifest. | A practice safety scenario only; never create a real fee or accepted-offer path. |
| j3 Sentiment qualification | No files to add; pack is generated in the browser. | Locally authored sample data only; no personal data. |
| j4 Answer comparison | No files to add; pack is generated in the browser. | Locally authored sample data only; no personal data. |
| t1 Shop-chat intents | No files to add; pack is generated in the browser. | Locally authored fictional messages only; no personal data. |
| t2 News entities | No files to add; pack is generated in the browser. | Locally authored fictional sentences only; no real personal data. |
| t3 Article topics | No files to add; pack is generated in the browser. | Locally authored fictional articles only; no personal data. |
| t4 Scam messages | No files to add; pack is generated in the browser. | Locally authored fictional messages only; no real links, credentials or personal data. |
| t5 Claim checking | No files to add; pack is generated in the browser. | Locally authored fictional claims and evidence only. |
| t6 Answer ratings | No files to add; pack is generated in the browser. | Locally authored fictional prompts and answers only. |
| i1 Image classification | `pack.zip`, `image-01.jpg` through `image-12.jpg` | 12 images maximum, each 1600 px wide or less and under 300 KB; own photos or public-domain only. |
| i2 Vehicle boxes | `pack.zip`, `image-01.jpg` through `image-12.jpg` | 12 images maximum, each 1600 px wide or less and under 300 KB; own photos or public-domain only. |
| i3 Image quality | `pack.zip`, `image-01.jpg` through `image-12.jpg` | 12 images maximum, each 1600 px wide or less and under 300 KB; own photos or public-domain only. |
| i4 Image transcription | `pack.zip`, `image-01.jpg` through `image-12.jpg` | 12 images maximum, each 1600 px wide or less and under 300 KB; own photos or public-domain only. Avoid signs containing personal data. |
| a1 English transcription | `pack.zip`, `clip-01.mp3`, `clip-02.mp3` | MP3, 30–60 seconds each, under 1 MB each; own recordings with written consent or public-domain only. |
| a2 Language tags | `pack.zip`, `clip-01.mp3`, `clip-02.mp3` | MP3, 30–60 seconds each, under 1 MB each; own recordings with written consent or public-domain only. |
| a3 Sound events | `pack.zip`, `clip-01.mp3`, `clip-02.mp3` | MP3, 30–60 seconds each, under 1 MB each; own recordings with written consent or public-domain only. |
| v1 Action tags | `pack.zip`, `clip-01.mp4`, `clip-02.mp4` | MP4, 10–20 seconds, 720p, under 5 MB each; own video with written consent or public-domain only. |
| v2 Wave events | `pack.zip`, `clip-01.mp4`, `clip-02.mp4` | MP4, 10–20 seconds, 720p, under 5 MB each; own video with written consent or public-domain only. |
| v3 Scene tags | `pack.zip`, `clip-01.mp4`, `clip-02.mp4` | MP4, 10–20 seconds, 720p, under 5 MB each; own video with written consent or public-domain only. |

Text-only project packs are generated in the browser from the current project brief and CSV data. Do not add static text-job ZIPs. For image, audio and video jobs, keep each pack under its matching job directory and do not mark a file available until it has been added at the listed path. In `manifest.json`, change an available file from a string such as `"image-01.jpg"` to an object such as `{"path":"image-01.jpg","available":true}`. Mark the archive with `{"path":"pack.zip","available":true}` only after adding the complete pack. Leave unavailable entries as strings (or set `available` to `false`); the page shows the preparation notice and omits their links and previews until files are available.

## Media reference files

Each media job has a `reference.json` beside its manifest. Keep it in this form while the media or answer key is unfinished; exports uploaded in this state are not scored:

```json
{
  "jobId": "i1",
  "status": "not_configured",
  "answers": []
}
```

When all reference answers are ready, set `status` to `"configured"` and put the answer rows in `answers`. The identifier property must use the job's CSV ID column (`file`, `image`, or `clip_id`). Use these shapes for the supported scoring types:

**Classification** (`i1`, `i3`, `a2`, `v1`, `v3`):

```json
{ "jobId": "i1", "status": "configured", "answers": [
  { "file": "image-01.jpg", "label": "animals" }
] }
```

**Bounding boxes** (`i2`):

```json
{ "jobId": "i2", "status": "configured", "answers": [
  { "image": "image-01.jpg", "label": "bicycle", "x": 30, "y": 40, "width": 120, "height": 80 }
] }
```

**Transcription** (`a1`, `i4`):

```json
{ "jobId": "a1", "status": "configured", "answers": [
  { "clip_id": "clip-01.mp3", "transcript": "A short fictional sample sentence." }
] }
```

For image transcription job `i4`, use `file` instead of `clip_id`.

**Sound events** (`a3`):

```json
{ "jobId": "a3", "status": "configured", "answers": [
  { "clip_id": "clip-01.mp3", "label": "rain", "start_seconds": 1.2, "end_seconds": 4.5 }
] }
```

**Video segments** (`v2`):

```json
{ "jobId": "v2", "status": "configured", "answers": [
  { "clip_id": "clip-01.mp4", "label": "person_waves", "start_seconds": 1.0, "end_seconds": 3.0 }
] }
```

Use the exact filenames from `manifest.json`. A clip may have multiple event/segment rows. Only use fictional or appropriately licensed media and data.
