---
name: transcription
description: Add, fix and polish ChatCut Desktop captions and subtitles with caption tools, published presets, keyword emphasis, grouping, layout, animation and translation. Also covers missing speech transcription, transcript search and explicitly requested source-transcript repair. Use across built-in and connected agents.
---

# Captions and speech transcription

## Caption-first workflow

1. Start caption/subtitle fixes with `read_captions` → `edit_captions`. Read the relevant Cards with `words:true`; follow pagination for the requested scope. Preserve the picture edit, audio and source transcript unless changing them is requested.
2. Correct caption spelling, punctuation and wording with `set_card_text`. Listen to uncertain words instead of guessing. Use native punctuation/case/Chinese-script settings for systematic display changes. Caption text changes what viewers read, not the reusable source transcript; do not require source FIX, raw transcript-file edits, a source audit or re-transcription for caption polish.
3. Use the caption tools below for presets, grouping, keyword selection, style, layout and translation. Target one Card, a track or all captions according to the request, not according to whatever scope is easiest.
4. Re-read the affected Cards and inspect them over the actual footage. If source or clip changes were also requested, finish those before final Card polish and recheck the affected captions.

## Readable baseline and purposeful emphasis

Start a new look from the published caption presets, including animated Motion
Graphic treatments. For simple “add captions”, enable using the saved preference
without forcing a chooser; apply a concrete requested tweak directly.
For style comparison, first discover `publishedTemplates` with
`edit_captions action:"template"` and the actual `languageCode` in `json`; use
`query` for a named treatment and `publishedNextOffset` as `offset` to continue.
Load `widget-forms` and copy the selected entry's `previewOptions` into preview
cards. Recommend only published templates, including relevant
`kind:"motion-graphic"` entries for expressive/animated requests. Do not choose
from a legacy built-in list merely because its IDs appear in an old example.
Embedded widgets use returned `presetId` (`catalog:<UUID>:<languageCode>`);
external forms use the returned `captionPreview` with `kind:"catalog"`, exact
`templateId`, `revision`, and `languageCode`. Keep the actual caption target and
language. Preview before applying, inspect returned availability/errors, and do
not claim support is absent without checking or replace an MG preview with
ordinary CSS. After selection, apply the recorded published identity to its
recorded target and verify with `read_captions`.

Apply a shared readable baseline, then re-read Cards because style regrouping can invalidate IDs. Use `split_card` with `{cardId,beforeTokenId}` from fresh Card words (choose a token after the first), `merge_cards`, `set_card_layout`, and Card styles for natural phrase groups and spacing. Read each tool's schema for its exact action fields. Use `edit_captions {action:"batch",edits:[...]}` for up to 100 ordered synchronous edits with one commit; a failed edit writes nothing. Do not carry old IDs through a regrouping operation in the same batch.

Use `set_track_style` for track defaults, `update_track` with `layout` for track
position, and `set_card_style` / `set_card_layout` for one Card. Timing tweaks use
`set_card_timing` in project frames, not media cuts or source-transcript edits.
Existing subtitle files use `import_subtitles`. For small changes to a dynamic
preset, prefer its exposed template properties over new source. Preserve
unrelated Card overrides/locks; an explicit preset replacement is a different
operation from an ordinary style tweak.

Select semantic keywords through `set_card_emphasis {cardId,spans:[{text:"exact words",emphasis:true}]}`; use `false` to suppress or `"auto"` to remove that exact annotation. Repeated text needs 1-based `occurrence`. Verify `read_captions words:true` returns the intended `textStyleRanges`, then inspect the bound template. Keep source-linked Cards and the selected treatment; keyword selection alone does not require new independent subtitles or template source changes.

If the user explicitly requests a new custom treatment that the published catalog does not supply, select a few phrases whose meaning deserves emphasis. Design semantic word groups, visual hierarchy, placement, entrance/exit rhythm and motion around the speaker's available negative space. Keep faces clear. Larger type or active-word highlighting alone does not fulfill that request. The user does not need to name a template or implementation technique. Use actual short and long phrases to judge whether the composition serves the spoken meaning; keep the remaining captions calm and readable.

For that custom treatment or revisions to existing custom source, load
`caption-template-impl` and author directly in the main agent, not a delegate.
Keep reusable source in a persistent project-owned directory and bind fresh
Cards through `set_card_style` and `style.template:{path,runtime,properties?}`.
Reuse that source across phrases; do not push it into the asset library.
`template` discovers/applies published presets, not custom source.
`template:null` chooses ordinary captions; omission in a merge retains a binding.

## Verify the delivered video

Inspect actual bound Cards over the footage: representative ordinary, emphasized, short and long phrases, word changes, and Card boundaries. Caption times are microseconds; frame queries need the project frame rate. Review the complete clip for corrected words, phrasing, readability, animation rhythm and face clearance. A template source, standalone preview or successful binding is not proof of rendered captions. Re-read/reopen the saved project, and inspect the requested export before claiming completion. Report checks not performed rather than inventing a successful review.

## Import, visibility, translation and retries

- Import local media with Desktop `push_asset`; use `browse_assets` for status. For a transcription job, wait with `track_progress {action:"wait",target:"transcription",assetIds:"<asset id>"}`. Do not upload local media through an unrelated external path to bypass a limitation.
- `trigger_transcript` starts idle or failed transcription; then wait. One pending status is not a failure. Treat `no_audio` as successful analysis with no transcript. For an ongoing job, judge stuck only after observed waiting exceeds `max(5 minutes,min(60 minutes,2 × asset duration))`. A wait timeout/cancellation does not cancel transcription. Do not poll while a wait is pending or force-retry a running job through unsupported actions.
- If ready captions are empty, check whether the placed clip's source range actually contains spoken words. Do not blindly regenerate. Any necessary clip change must respect the user's requested edit.
- Existing caption edits need no new recognition. When needed speech is genuinely missing, inspect `browse_assets`/`inspect_asset` and start `trigger_transcript` only for those sources; it uploads the full first audio stream and routes recognition by language. Reuse accepted text and existing jobs. Skip instrumental music, effects, silent visuals and unrelated sources. Do not install local ASR or start recognition when uploads are disallowed.
- `enable`/`disable` controls the whole caption item; individual track visibility persists. `read_captions` includes hidden tracks, role, sourceTrackId and contentLanguageCodes. Restore a hidden language with its returned `showAction`; hide it with `{action:"track",trackId,visible:false}`. A null track languageCode does not mean missing text.
- Translate only into a requested language: `edit_captions {action:"translate",json:"{\"languageCode\":\"es\",\"mode\":\"bilingual\"}"}`. `bilingual` preserves the source; `translation` hides source captions. Optional `trackId` inside json selects the source track. Restore visibility without generating a translation; use `set_card_text` for translated wording corrections.
- For reusable translated wording, read `translationSources:true` and use `set_translation_text`. Only when the user explicitly asks to repair the shared source transcript/speakers or import an existing transcript, read [source transcript maintenance](references/source-transcripts.md); it is not a prerequisite for caption polish.
- For editorial speech cleanup, load `talking-head-guide`: `clean_script` handles mechanical fillers/pauses, while `read_script` → edit `timeline.md` → `apply_script` handles semantic edits. Verify the resulting script.
