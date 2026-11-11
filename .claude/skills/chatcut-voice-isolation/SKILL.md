---
name: voice-isolation
description: |
  Apply or undo Desktop AI Voice Isolation (MossFormer2) for spoken voice with
  background noise, hiss, hum or room echo. Use for speech cleanup, 降噪,
  人声隔离 and 去混响. This processor suppresses non-speech sound.
user-invocable: true
---

# AI Voice Isolation

Use Desktop's native `isolate_voice` for spoken-voice cleanup. It is an on/off
source-processing setting, with no strength or amount control. The original
media stays intact; clearing restores its audio.

Confirm the target contains speech from the user's context, transcript or
preview. For an ambiguous clip, inspect it before applying. Music, ambience,
game sound and other non-speech audio can be suppressed or distorted. If the
user wants to preserve those sounds, explain the tradeoff; do not present this
processor as gentle general-purpose denoise or adjustable noise reduction.

For a whole-video request, cover every relevant speech clip, not only the first
visible clip. Discover tracks with `edit_track({ action: "list" })`. Identify the
speech tracks; keep separate music/ambience tracks out of the operation. For a
whole speech track, use its ID once:

```ts
isolate_voice({ action: "apply", trackId: "<speech track ID>" });
```

An audio track targets its audio clips; a video track targets their linked audio.
The tool applies to clips currently on that track, not future clips. Each call is
one atomic edit and one Undo, with a compact count summary. Check matched/changed
and skipped counts against the requested coverage. A missing or locked target
fails the operation without partially changing it.

For a small arbitrary subset, use `itemIds`; for one clip, use `itemId`. Do not
enumerate hundreds of IDs or call once per clip for a whole-track request.
`sourceAssetId` is an optional check for a single item. Do not pass `strength`,
`filePath` or `denoisedAssetId`.

`applied: true` or a batch count summary means the settings were committed, not that audio processing finished. Native processing runs asynchronously;
inspect processing state and review the audible result before claiming cleanup
is complete. Failed processing must be reported. There is no dedicated retry
operation. If the native route is unavailable, report the limitation; the manual
control is **Audio Inspector → AI Voice Isolation**.

For undo, including complaints about lost ambience or processing artifacts:

```ts
isolate_voice({ action: "clear", trackId: "<speech track ID>" });
```

Desktop downloads the model on first use and reuses native disk-cached audio
chunks for the source ranges needed by playback and export. It does not replace
the item's asset with a new `denoisedAudioAssetId`. Headless capture/export
prepares processed audio before rendering. Preserve separate music tracks when
the user only requests restoring the cleaned clip's original sound.
