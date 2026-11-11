## Captions for speech-led footage

Load `transcription` for the current Desktop caption-first workflow: `read_captions` → `edit_captions` for wording corrections, translation, Card grouping, emphasis, styling and layout, followed by real timeline verification. Keep source transcription unchanged for caption tweaks; source repair is a separate explicit task, not a mandatory first pass.

Choose the treatments the user requested. Start style changes from the published preset catalog returned by `edit_captions` action `template`, including relevant animated/Motion Graphic presets. For comparison, load `widget-forms` and use the returned preview options; apply the selected identity to the intended track or Card, then fine-tune with caption tools. Simple additions and concrete tweaks need no mandatory chooser. Preserve natural speech phrasing and keep the subject readable.

When emphasis is requested, select passages that help viewers understand or remember the spoken meaning. Preserve negation, conditions, uncertainty, required units and both sides of a contrast. Avoid emphasizing every filler or repeated setup. Use the current caption tools and the `transcription` workflow to realize the treatment, then inspect actual Cards in the composed video.

When emphasis was not requested, finish the user's task first; an optional follow-up may propose specific meaningful passages. Do not interrupt an explicitly requested end-to-end edit for that optional choice.

For a requested custom animated treatment or reference recreation beyond the catalog, load `caption-template-impl` and read its `references/mg-captions.en.md` completely before designing. Use its Desktop source/binding workflow, not an ordinary Motion Graphic overlay or the ordinary MG style-picker workflow. Preserve the requested caption-only scope.
