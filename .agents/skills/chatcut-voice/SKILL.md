---
name: voice
description: |
  Text-to-Speech (TTS), voice cloning, voiceover, narration placement/sync, and custom sound effects (SFX) generator. Use when the user wants generated speech from text, wants to clone a consented voice from uploaded reference audio, wants to correct a misspoken word or short phrase in recorded speech, wants to add/replace/align narration or voiceover for an existing video/timeline, wants to keep existing voiceover synced after visual retiming edits, needs voice audition/selection, or explicitly wants a newly generated/custom sound effect that is not available in the Sound Effects library.
user-invocable: true
---

# Voice & Sound Effects

`manage_voice` is the single entry for the voice catalog and the user's cloned
voices. `submit_voice` creates TTS audio assets. `submit_sound` creates custom
sound effects.

In ChatCut Desktop, `submit_voice` is available in the `skill-voice` group
independently of Skill loading. Use this Skill for voice workflow guidance. If the tool is
unavailable, tell the user and stop voice generation. Do not use operating
system speech synthesis such as macOS `say` as a substitute for ChatCut TTS.

## Read the matching reference first

These are required reads, not suggestions. Read the whole file before the
first tool call or question of that branch.

- A word or short phrase was actually misspoken in recorded speech: read
  [references/fix-spoken-mistakes.md](references/fix-spoken-mistakes.md). If
  the recording is correct and only the transcript is wrong, fix the transcript
  instead. A full rewrite or new voiceover uses the normal path.
- Narration, voiceover, dubbing, or replacement speech for an existing visual
  target (video, timeline, screen recording, slides, demo, B-roll, MG), even if
  the user never says "sync"; or changing visuals while keeping existing
  narration aligned: read [references/video-sync.md](references/video-sync.md)
  before drafting narration, generating TTS, or placing audio. Skip it only for
  a standalone audio asset with no visual target.
- The user asks for expressive delivery (emotion, tone, energy, pauses, pacing,
  emphasis, whispering, laughter, accent, singing): read
  [references/delivery-controls.md](references/delivery-controls.md) before
  writing the final text or choosing controls.

## TTS

1. Choose a concrete voice with the audition path below. Every option comes
   from `manage_voice action="list" voiceType="all"` for the current request,
   with the target narration `language` and the conversation `locale`. Never
   build options from memory, translated names, filenames, or broad traits.
2. Submit with the chosen entry's `voiceRef` alone; never add `provider` or
   `voiceId` to it. Submit only entries whose `supportedUses` includes `tts`.
   The legacy `provider` + `voiceId` pair is only for a voice the host attached
   with those values; follow that attachment's hidden context.
3. `submit_voice` only creates an audio asset. Placing, replacing, trimming,
   and aligning it on the timeline is a separate step with timeline tools.
4. Keep standalone narration in one `submit_voice` call when it fits the
   selected model's per-request limit. For ElevenLabs, v2/v4 allow 10,000
   characters and v3 allows 5,000. If the script exceeds the limit, split at
   sentence boundaries without dropping or rewriting text, keep the same
   voice/model, and deliver a continuous narration when requested. Also split
   when the user asks for separate clips or a visual workflow needs them.
5. Use only the controls in the chosen entry's
   `capabilities.supportedControls`; never infer support from a voice name or
   family. A cloned voice's empty list still takes delivery cues written in its
   text, so it stays a candidate for expressive requests. Never claim stable
   age, regional accent, pronunciation dictionary, or exact duration control.
   For ElevenLabs, `supportedControls` is a union: check the selected model in
   `capabilities.controls.models`. Audio tags require an explicitly selected
   `eleven_v3` or `eleven_v4`; the default v2 does not interpret them. Never
   send `speed` with v4 or v4 Turbo.

Keep the default `eleven_multilingual_v2` when it supports the request. Pass
language codes such as `vi`, `th`, `zh-CN`, or `ja-JP` to discovery, and read
`modelGuidance`. Catalog language tags and sample language are not model
language guarantees. v2 does not speak Vietnamese or Thai; explicitly select
v3 or v4 for those languages. Do not silently switch every request to v4.
When speed matters, keep a speed-capable model that also supports the target
language; do not substitute v2 for a language it cannot speak. Keep `locale`
for display names, independent from narration language.

Japanese narration (including a Chinese conversation asking for Japanese): list
with `language="ja"` (never `other`) and `locale` set to the conversation
language. Audition with the returned Japanese sample; `sampleLanguage` tells
which language a sample actually speaks, so never relabel a Chinese or English
sample as Japanese. Cloned voices keep their own sample language. For a chosen
Doubao official voice, add `explicitLanguage:"ja"` when submitting. Keep returned
voice names.

### Keep voice providers private

Doubao, ElevenLabs, Fish Audio, their model names, provider voice ids, and
provider URLs are internal. Never show or hint at them in replies, progress
updates, recommendations, cards, clone instructions, summaries, or errors. Say
`official voices` / `官方音色` and `cloned voices` / `克隆音色` / `My Voices` /
`我的音色`, or use the voice's saved name. When an error mentions a provider,
keep its actionable meaning and drop the provider details. Provider values
belong only in tool arguments and in reading tool results.

## Cloned Voices in ChatCut Desktop

Before offering voices for a TTS request that does not name a concrete voice,
call `manage_voice` with `action:"list"` and `voiceType:"all"`. Build one
audition surface from the returned normalized candidates, keeping ready cloned
voices first and matching official voices after them. It is fine to infer likely
official voice qualities from the script, but never drop the user's ready
cloned voices because of their sample language, empty `supportedControls`, or
missing official catalog tags; cloned voices narrate any language.

A request to narrate in the user's own voice (for example "my own voice", "my
cloned voice", or a workflow that clones when no cloned voice is ready) is a
concrete source choice, not a request for official options. Audition only the
user's ready cloned voices with the host's clone entry described below, or take
the clone route below directly when none is ready. Offer official voices only
if the user declines cloning or asks for them. Cloned-voice narration is
synthesized from text and can use a language the speaker never recorded, so a
narration language the user cannot speak is a reason to use their cloned
voice, never a reason to switch to official voices.

When the user has already supplied or identified usable local audio or video in
the current project for this cloning request, do not open the native flow and
do not ask them to select or upload the same source again. Resolve the source
asset, call `manage_voice` with `voiceType:"custom"` and
`action:"check-create-access"`, then collect only missing voice name, preview
text, and explicit authorization through `widget-forms`. After authorization, call
`manage_voice voiceType:"custom" action:"clone"` with that audio or video asset
id, plus `languageCode` when the reference's spoken language is known. Desktop
extracts the video's complete default audio track locally and
uploads only audio. Pass video directly; do not extract, convert, or import
another audio asset yourself. Detached timeline audio still references its
original video asset, so use that asset id. Timeline trims are not applied. The
reference audio must be 10–180 seconds and at most 25 MiB after extraction;
this size limit does not apply to the original video. A video without an audio
track or a reference outside these limits cannot be cloned; do not silently
truncate it.

### External Codex / Claude cloning

After the user chooses the clone entry, reuse any reference supplied for this
cloning request. External hosts use the existing attachment and Agent-driven
cloning flow; they cannot open the native clone dialog. Before asking for any
missing inputs, call `manage_voice voiceType:"custom"
action:"check-create-access"`. If creation is blocked by the current plan or
voice quota, explain the returned restriction and stop intake; never hide the
clone entry based on an earlier catalog result.

Load `widget-forms` and collect only the missing voice name, editable preview
text (1–100 Unicode characters), and explicit consent in one form. Consent is
required and initially unselected: the user must confirm that they own the
voice or have permission to clone it, and will not use it for impersonation,
fraud, or unlawful purposes. An attachment or choosing the clone entry is not
consent. Use the original localized preview suggestion: `这是你的克隆音色，希望你喜欢这个效果。`
/ `This is your cloned voice. I hope you like the result.` / `Esta es tu voz
clonada. Espero que te guste el resultado.` Prefill the editable field when the
host supports it; follow `widget-forms`' Codex field mapping when only a
placeholder is supported. Preserve the user's preview text exactly; ask them to shorten an
overlong value instead of rewriting or truncating it.

When no usable reference exists, follow `widget-forms`' existing composer
attachment flow outside the form. Ask for 10–180 seconds of reference speech;
recommend 30–60 seconds of clean solo speech. After consent, import a readable
local attachment with Desktop's `push_asset` and use the returned audio or
video asset id. Never ask the user to upload an already available reference
again, and never pass a local path or URL as `sourceAssetId`.

Once the required inputs and consent are present, call `manage_voice` with
`voiceType:"custom"`, `action:"clone"`, `sourceAssetId`, `name`,
`previewText`, and `confirmedConsent:true`. Keep the returned custom voice and
its exact preview URL together. Let the user listen through the same host's
supported preview surface, then choose whether to use it or retry. Codex uses its
audio-card recipe; Claude must follow `widget-forms`' private-media limitation
and use a supported host media surface or ChatCut, never a blocked inline player.
Submit the selected voice's exact `voiceRef` directly. Generation checks current
ownership, readiness and access. Retry requests a
replacement reference; if the tool cannot replace it in place, explain that
limitation instead of silently creating another voice. A free clone preview
does not authorize final TTS.

A cloned-voice attachment or an exact voice ID/reference can resolve the user's
selection directly. A saved name can resolve it only when exactly one current
candidate matches; ask when names are duplicated or selection is otherwise ambiguous.
Submit the selected entry's `voiceRef` directly. For expressive delivery with a cloned voice,
read [references/delivery-controls.md](references/delivery-controls.md).

## Voice Audition Before Generation

When the user needs TTS and has not already chosen a concrete preset, treat
broad words like "middle-aged male", "warm female", or "professional" as
requirements for filtering candidate voices. Never build voice options from
memory, translated names, filenames, or broad descriptions.

Use the user conversation language (the language the user talks to you in) for
the surrounding reply, `form-visual label`, `visual-option name`, `summary`,
and `submit_label` (`Submit` / `提交` / `Enviar`). Use the target narration
language (the language being synthesized) only to choose the voice catalog.
"help me generate ... voice over in Chinese" is an English conversation asking
for Chinese narration, so the audition copy stays in English while the
candidates are Chinese-capable voices.

1. Call `manage_voice action="list" voiceType="all"` with the target narration
   `language`, user conversation `locale`, and explicit requirements such as
   gender, age, tone, and use case.
2. If no preset matches all explicit requirements, say there is no exact match
   and offer the closest supported presets with a clear caveat.
3. Keep returned ready custom voices with previews first, followed by 2-4
   matching returned official voices. The built-in picker shows only the first
   five playable cards.
4. Load `widget-forms` and render the combined voice selection for the current
   host as described below. This skill owns the candidates and branch actions;
   `widget-forms` owns the form, media cards, and attachment interaction.
5. Wait for the user to choose.
6. Submit the selected official or cloned voice's exact `voiceRef` directly.

Keep each option's type, submission id, display label, preview URL, summary,
and `voiceRef` tied to the same `manage_voice` entry, and keep that
label-to-entry map in context. Only an existing voice option maps to a voice
entry; clone and Other are branch actions, never voice ids for TTS.

Every external voice recommendation or selection form must contain all three
entries in the same single-choice group:

1. Existing voice options with their current audition players: ready cloned
   voices first, followed by the matching official candidates above.
2. A label-only clone action, mapped to `clone_voice`, without audio. Localize
   it as `Clone my voice` / `克隆我的音色` / `Clonar mi voz`, or `Clone another
voice` / `克隆其他音色` / `Clonar otra voz` when a ready clone exists.
3. An explicit `Other` / `其他` / `Otra` entry that opens the host's existing
   free-text input for different voice requirements.

Include clone and Other even when the shortlist has only two candidates or
already contains ready cloned voices. Do not replace the combined audition
with a separate question asking which voice source to use. Do not filter out
the clone entry by plan, slot count, free-trial status, or provider availability;
the creation preflight runs after the user chooses it.

Wait for the submitted choice. `clone_voice` enters the cloning flow on the
next turn; it does not start cloning or submit TTS from the audition reply.
Other uses the submitted text to refine the requirements and refresh the
audition, unless it explicitly chooses a concrete voice or the clone branch.
Never treat Other text as an official voice id or silently select a default.

In external Codex, use `ask_followup_questions` with `type:"single"` and
`variant:"voice"`. Include `id:"clone_voice"` without `audioUrl` and an
explicit `id:"__other__"` option in that same field. For existing voices, pass each returned
`previewUrl` verbatim as `audioUrl`: never prepend an inferred S3, CDN, editor,
localhost, or production base URL, and never reconstruct an absolute URL from a
filename pattern. After the user submits, map the submitted display name back
to its entry and submit that entry's `voiceRef` without another confirmation.

In external Claude, render `widget-forms`' combined voice-card recipe. Resolve
each official `sampleMediaKey` (for example `voice/<voiceId>/ja`) through the
`widget-forms` Skill's bundled `references/widget-media.json`; resolve that path
from the loaded `widget-forms` directory, not this Skill or `CLAUDE_PLUGIN_ROOT`.
Use a label-only card when the key is absent and never process the original
official sample URL. Keep ready custom voices as label-only choices; their
runtime `previewUrl` must be auditioned through a supported host media surface
or ChatCut before applying, not embedded in Claude's public-media form. Include the
label-only clone pill and the host-wired Other pill with its adjacent input in
the same group; map the localized clone label to `clone_voice` in context.

In Claude Code specifically, use the provider-neutral localized display name as
the Elicitation `data-value`, unique per option: when entries share a name,
add a short readable suffix such as " (2)" to the repeat, in both its visible
label and its value. Keep the voice ids only in the label-to-entry map held in
context. Use an ephemeral DOM audio key for playback, not a voice id. After the
user presses Enter and the host-generated answer line appears, map the
submitted value back to its entry and continue without another confirmation.

## Sound Effects

Search the Sound Effects library before spending credits: call `browse_library`
with the sound-effects category and a descriptive query, then place the
returned library sound with `edit_item` as its description explains. Use
`submit_sound` only when the user explicitly asks for a generated or original
sound, or the library has no suitable match. Describe the sound specifically:
source, setting, and style ("footsteps on a wooden floor in an empty room",
"cinematic whoosh", "8-bit game coin").

## Hard rules — what you must NOT do

1. Never combine `voiceRef` with `provider` or `voiceId`, and never pass a
   provider voice id to any tool.
2. Never submit TTS when the voice is only described broadly and the user has
   not confirmed a concrete preset.
3. Never recommend or render a TTS voice option before calling `manage_voice
action="list" voiceType="all"` for the current request.
4. Never claim stable age, regional accent, pronunciation dictionary, or exact
   duration controls; the current tool does not expose those as reliable fields.
5. Never replace original recorded speech with TTS unless the user asks.
6. Never clone before the user explicitly confirms ownership or permission, and
   never clone unrelated speech already in the project.
7. Never expose Doubao, ElevenLabs, Fish Audio, provider model names,
   provider-specific ids, or provider URLs to the user. Use `official voice`
   and `cloned voice` product terminology, and sanitize provider details from
   visible errors and status messages.
