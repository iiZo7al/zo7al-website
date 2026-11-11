# Seedance 2.5

Read this document before generating with `model: "seedance-2-5"`, the default for `submit_video`.

## Capabilities

- Duration: 4-30 integer seconds via `durationSeconds` (default 5).
- Resolution: 480p, 720p (default), or 1080p. Ark encodes 1080p output as 10-bit H.265/HEVC. ChatCut offers 2.5 up to 1080p; for 4K use full `seedance2`. Ark lists about CNY 0.67/1.51/3.74 per second at 480p/720p/1080p without video input; reference-video seconds are billed too. In ChatCut's own chat the confirmation card shows the exact credit quote.
- Ratio: `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9`, or adaptive for locked frame/edit/extend tasks.
- Output: mp4 by default; set `outputFormat: "mov"` for edit/extend work where color fidelity and audio continuity matter.
- Audio generation is always enabled. Describe dialogue, music, and ambience in the prompt; a request for silence may be ignored, so mute the clip's audio after import when it must be silent.
- Native prompt/audio output languages include Chinese, English, Spanish, Indonesian, Malay, Thai, Arabic, Portuguese, Vietnamese, Japanese, and Korean.

## Inputs

| Channel           | Tool param   |                   Limit |
| ----------------- | ------------ | ----------------------: |
| Exact first frame | `firstFrame` |                       1 |
| Exact last frame  | `lastFrame`  | 1, requires first frame |
| Reference images  | `refImages`  |                      30 |
| Reference videos  | `refVideos`  |                      10 |
| Reference audios  | `refAudios`  |                      10 |

Video references must each be 2-30s and total at most 30s. Audio references must be MP3/WAV, each 2-30s, and total at most 30s. The tool validates known audio format/duration metadata before confirmation; unknown legacy metadata remains admissible.

Media bounds (Ark's own for every Seedance 2.x model; MiniMax's differ): frame images, reference images, and reference videos 300–6000 px per side with width/height 0.4–2.5; reference videos 407,696–8,295,044 total pixels (about 480p to 4K) at 24–60 fps.

Seedance 2.5 supports audio-only reference generation. A visual reference is not required when `refAudios` is the only input.

Frame mode and reference mode remain mutually exclusive. Do not combine `firstFrame`/`lastFrame` with any `refImages`/`refVideos`/`refAudios`.

Media inputs accept project asset refs from `read_project`, `asset://<id>`, same-project asset URLs, or public HTTPS/`s3://` resource URLs. Pass public resources directly without `push_asset`; the backend measures their actual media metadata and keeps them outside the library. Refer to inputs explicitly as `@Image1`, `@Video1`, and `@Audio1`, then immediately identify what each reference controls.

## Task Modes

The request shape and prompt determine the task:

| Intent               | Inputs                                      | Required controls                           |
| -------------------- | ------------------------------------------- | ------------------------------------------- |
| Text generation      | prompt only                                 | chosen ratio and 4-30s duration             |
| Reference generation | any reference arrays                        | chosen ratio and 4-30s duration             |
| First frame          | `firstFrame`                                | ratio becomes adaptive; 4-30s               |
| First/last frame     | both frame params                           | ratio becomes adaptive; 4-30s               |
| Video edit           | source in `refVideos`, `taskMode: "edit"`   | source duration is inherited; output is new |
| Video extend         | source in `refVideos`, `taskMode: "extend"` | set extension duration; output is new       |

The upstream model classifies edit and extend intent from the prompt. Use explicit wording such as "Edit @Video1...", "Replace...", "Remove...", "Extend @Video1 forward...", or "Continue @Video1...". Do not accidentally use edit/extend language for a semantic reference-only request.

For edits, Seedance locks ratio and duration to the source. `submit_video` sends `ratio: "adaptive"` and `duration: -1`; edit sources must be 4-30s. For extensions it sends adaptive ratio and the requested `durationSeconds`. Both paths output mp4 unless `outputFormat` is set, and always create a new generated asset; the original is unchanged.

## 480p Drafts and 1080p Finals

Every `seedance-2-5` 480p clip is a draft, priced like any 480p clip. Offer one when the user wants to check a shot cheaply before paying for the final, or for a long or costly 1080p clip. Never drop to 480p on your own.

1. Submit with `resolution: "480p"`.
2. Show the draft to the user. If they approve, submit `{ "model": "seedance-2-5", "fromDraft": "<the draft's assetId>" }` with no prompt, references, frames, duration or ratio. The final reuses all of them, plus the seed and audio setting, and is 1080p only.
3. If the user wants changes, write a new prompt and make a new 480p clip; a final cannot change the shot.

This also applies to remake drafts: create them with `submit_video_remake` and `resolution: "480p"`, then use normal `submit_video` with `model: "seedance-2-5"` and `fromDraft` set to the completed remake draft's assetId for the approved 1080p final. Do not rerun `submit_video_remake` at 1080p to finalize a draft; that regenerates the remake. For content changes, revise the remake plan or images and make a new 480p remake.

Limits: drafts can become finals for 7 days. The final is close to the draft but not frame-identical, and can still fail content review. If the user only needs 720p, one normal 720p clip costs less than a draft plus a 1080p final.

## Continuing a Shot

Set `returnLastFrame: true` to also save the clip's last frame, Ark's unwatermarked full-resolution JPEG, as an image asset; the receipt names it. Pass that image as the next clip's `firstFrame` to continue the shot without extracting a frame. Skip it for one-off clips.

## Prompt Structure

Write as a director, not as a keyword list:

1. Map every input to its role.
2. Give a one-sentence subject + setting + event + style overview.
3. Describe the sequence with integer-second timestamps for longer clips.
4. Specify shot size, camera movement, action, performance, lighting, dialogue, music, and sound effects where they matter. Mark sound as Ark documents: music in `()`, sound effects in `<>`, dialogue in `{}`, on-screen subtitles in `【】`.
5. End with global continuity and negative constraints.

Use continuous timestamp ranges without gaps, for example `0-5s`, `5-12s`, `12-20s`. Do not overpack a time range; the model will omit or over-cut impossible action density.

For many references, list mappings before the narrative:

```text
References: @Image1 is the hero product; @Video1 supplies camera motion only; @Audio1 supplies rhythm and vocal tone.
0-6s: ...
6-14s: ...
14-20s: ...
No subtitles. Keep the product geometry and label unchanged throughout.
```

Seedance always generates audio. The prompt may ask for "no BGM", "ambient sound only", or "no dialogue", but the model may not comply; for a silent clip, mute the clip's audio after import. Say "no subtitles" when generated text is unwanted.

## Consistency

- Reuse the same image anchors across every shot that shares a person, product, or scene.
- Carry the latest approved video in `refVideos` when motion/style continuity matters.
- Explain what to copy from each reference; do not ask the model to copy every property unless that is intended.
- After two text-only retries for identity drift, stop and add or replace a visual anchor.

## Content Review

Raw references containing real people may be rejected. Prefer authorized portrait assets or eligible trusted outputs. If content review rejects an input, surface the failure and ask for a different/authorized reference; do not blindly retry the same media.

## Example

```ts
submit_video({
  model: "seedance-2-5",
  name: "Twenty-second launch film",
  durationSeconds: 20,
  ratio: "16:9",
  resolution: "720p",
  refImages: ["product-image-id"],
  refAudios: ["soundtrack-id"],
  prompt:
    "References: @Image1 is the exact hero product; @Audio1 controls rhythm. 0-6s: macro reveal... 6-14s: orbit... 14-20s: final packshot. Preserve product geometry and label. No subtitles.",
});
```
