# Project pack assets

Matanda: add only media that you own or are authorized to use. Never add identifiable faces, minors, or personal data. Use public-domain media or your own media; recordings require written consent from every identifiable voice.

| Job | Exact files to add | Per-file limit and source requirement |
| --- | --- | --- |
| j1 Label customer reviews | `pack.zip` (generated locally; no added media) | Locally authored sample data only; no personal data. |
| j2 Scam listing | `pack.zip` (generated locally; no added media) | Locally authored sample data only; never create a real fee or accepted-offer path. |
| j3 Sentiment qualification | `pack.zip` (generated locally; no added media) | Locally authored sample data only; no personal data. |
| j4 Answer comparison | `pack.zip` (generated locally; no added media) | Locally authored sample data only; no personal data. |
| t1 Shop-chat intents | `pack.zip` (generated locally; no added media) | Locally authored fictional messages only; no personal data. |
| t2 News entities | `pack.zip` (generated locally; no added media) | Locally authored fictional sentences only; no real personal data. |
| t3 Article topics | `pack.zip` (generated locally; no added media) | Locally authored fictional articles only; no personal data. |
| t4 Scam messages | `pack.zip` (generated locally; no added media) | Locally authored fictional messages only; no real links, credentials or personal data. |
| t5 Claim checking | `pack.zip` (generated locally; no added media) | Locally authored fictional claims and evidence only. |
| t6 Answer ratings | `pack.zip` (generated locally; no added media) | Locally authored fictional prompts and answers only. |
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

Text-only packs already contain locally generated template and correct-example CSV files. For image, audio and video jobs, keep each pack under its matching job directory and do not mark a file available until it has been added at the listed path. In `manifest.json`, change an available file from a string such as `"image-01.jpg"` to an object such as `{"path":"image-01.jpg","available":true}`. Mark the archive with `{"path":"pack.zip","available":true}` only after adding the complete pack. Leave unavailable entries as strings (or set `available` to `false`); the page shows the preparation notice and omits their links and previews without requesting nonexistent files.
