# Source transcript maintenance

Use this reference only when the task explicitly requires changing the shared
source transcript, speaker assignments, or importing an existing transcript.
For caption spelling, wording, grouping, styling and translation, stay with
`read_captions` / `edit_captions` instead. A caption wording edit does not claim
to repair reusable source transcription.

## Repair an accepted transcript

Check suspected mistakes against speech and context. Read the relevant source
with `inspect_asset {assetId,transcriptRanges:[{start,end}]}`. These ranges and
returned `startUs`/`endUs` are original-source microseconds, not timeline time.
Use the placed clip's trim/speed mapping when necessary. `find_transcript`
locates phrases but its times are not source-edit locators.

Use `manage_transcript action:"fix"` with `asset` and `content`; preview a
multi-command batch with `preview:true` before applying it. `FIX [sN]: wordIdx
-> "newText"` replaces one word. Use the returned 1-based `segmentIndex` and
0-based `wordIndex` without renumbering filtered results; silence rows are not
editable words. `SPEAKER [sN-sM]: Name` assigns speakers. Preserve meaning and
do not invent uncertain speech.

All indexes in a call address the transcript before that call. `""` removes
word text without cutting audio or shifting later commands in the same batch.
Reread locators after committing. Word edits require real word timing;
sentence-only content does not support a fabricated word-edit command.

The project writer updates derived views and retains recovery state. Re-read
the source and affected captions afterward; authored overrides and translations
have their own editorial meaning. When source repair and caption polish are
both requested, complete source repair first. Use Script for playback cuts.

## Import a user-supplied transcript

`manage_transcript action:"replace",format:"normalized"` accepts an existing
user-supplied transcript with the inspected source identity and complete real
word timing. Follow the tool's normalized format and clock requirements. This
is not an alternative recognition workflow. Explicit `replace:true` is needed
to replace accepted text; recovery copies and source/text revision checks
protect against stale overwrites. Use the tool rather than patching persisted
transcript files to bypass those checks.
