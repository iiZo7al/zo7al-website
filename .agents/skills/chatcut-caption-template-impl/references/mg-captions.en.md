# Creating and Recreating MG Captions

Use this reference to create, recreate, or revise animated typography for captions, expressing actual speech through type, layout, color, and motion. The user may provide a video reference, a static reference, or simply a desired mood and purpose. When no explicit reference is provided, start with the project's Design Style; if none is selected, build the design from the actual footage and content.

This document covers creative methods, not a shared implementation API. Use the caption tools and instructions available in the current environment to read captions, edit viewer-facing wording, choose presets, and persist the result. Follow the preset workflow when applying an existing style. Use this reference when a new design or a change to a template's behavior is needed.

Desktop custom templates use persistent local source and caption template bindings through `caption-template-impl`. Web/backend custom renderers use inline `code` and `properties` with `edit_captions action:"renderer"` and the active Motion Graphics skill's `caption_v1` and Web runtime references. These routes are not interchangeable. Do not delegate caption authoring or create an ordinary MG asset as a substitute. Saving a project treatment does not publish a catalog template.

## Establish the Task

Read the user's request, the complete captions for the target segment, and the actual footage. Identify the target language, aspect ratio, caption scope, selected project Design Style, and existing caption treatment. Follow caption-read pagination for the requested scope. Consider speech rhythm, background brightness, subject placement, and other text in the frame. Use the actual captions and word timings. When word timings are unavailable, design within the available timing precision rather than inventing precise word synchronization. Display entries sharing a whole Card interval do not establish individual spoken-word onsets.

Distinguish two outcomes. Captions designed for the current video can emphasize specific meanings in that content. A reusable style must also work with new wording, short and long phrases, and subsequent applications. Proceed from the user's stated goal. Ask only for missing information that would materially change the design; neither a reference video nor a style questionnaire is a prerequisite.

Correct requested caption spelling and wording through caption tools, not rendering code. Repair the shared source transcript only when explicitly requested; do not require a source audit or re-transcription for caption polish. If source or picture edits are also part of the task, finish them before final presentation work and reread affected captions. Preserve wording, word timings, and existing user emphasis choices during a style-only change. Use the appropriate caption editing tools when phrasing or segmentation needs to change. Do not delete words, substitute text, or rewrite source transcription inside rendering code.

## Establish the Static Visual Direction

### When the Project Has a Design Style

Call `manage_design_style` with action `get`, without `designStyleId`, to read the targeted project's selected design specification. Do not infer the style from its name or cover alone. Inspect its palette, fonts and their roles, style guidance, and relevant visual examples. Treat an explicit no-selection result (`status:"no_active_design_style"` on Web/backend) as permission to use footage-based design. A failed read means the state is unknown; resolve or explain the read failure rather than claiming no style is selected. If the user's supplied direction is sufficient to proceed despite that failure, state the unverified project-style constraint. The user's explicit requirements for this task take priority. Preserve the project's visual direction wherever no change was requested.

Translate the specification into useful caption relationships: the color and font of the main text, accent color or weight for emphasis, the treatment of supporting information, and any need for background blocks, outlines, or shadows. For example, a cream, dark brown, and orange palette could use cream for the main text, orange for selective emphasis, and dark brown for background support where needed. Verify those roles over the actual footage rather than trying to use every color everywhere.

A Design Style provides visual guidance; it is not necessarily a caption preset ready to apply. If it links to caption templates or saved styles, check whether they meet the current request and are available for the target language and host. When new MG captions are needed, carry over suitable color, typography, and material relationships, then design layout and motion for the current content. Fill gaps in the specification using the footage. If a font is unavailable or lacks the target language, choose a fallback with a similar visual role and letterform characteristics, and explain material differences.

### When No Design Style Is Selected

Inspect representative frames from the target segment, including the area captions will occupy, changes in background brightness, and major scene changes. Consider existing brand or product colors, clothing, surroundings, lighting, and text already in the frame. Assess the overall color temperature, saturation, visual density, and mood.

Choose a coherent palette with sufficient reading contrast: main text, accents, and background or outline colors where needed. **Prefer low-saturation colors when choosing a palette independently**, so captions sit naturally within the footage. This is a creative default, not a runtime limitation or a guarantee of contrast. Use a more vivid accent sparingly when emphasis calls for it. Low saturation does not mean low brightness or low contrast; text must remain clearly readable. Explicit user colors and the existing Design Style take priority, so do not desaturate them simply to follow this default. Echo colors in the footage without making captions disappear into similar backgrounds. Do not just sample the dominant color of one frame or replace the entire palette at every cut. Plan how the same palette will handle light and dark backgrounds, then choose fonts that fit the content and remain readable at the actual display size.

Compare candidate treatments using real short and long phrases over representative frames, then choose the most suitable direction and continue. Present alternatives when the user asks to compare them; ordinary caption creation does not require a color questionnaire. This inferred direction is for the caption design. Do not automatically save it as, or replace, the project's Design Style.

### When the User Provides a Screenshot, Poster, or Other Static Reference

Extract typography roles, weight, color relationships, spacing, background blocks, and material qualities. Relate them to the project's visual direction and the actual video backgrounds. A static image can establish visual language but cannot establish entrance, word-following, or exit behavior. Design motion separately from the user's goal, speech rhythm, and readability needs. If the user asks to borrow only colors or fonts, keep that scope.

## Design from the Message When There Is No Motion Reference

Translate requests such as “polished,” “playful,” or “impactful” into concrete relationships: where the viewer should look first, what must remain readable, and when a change should occur. Build around the actual footage and delivery rather than stacking effects from a list.

Establish a compact set of design decisions:

- **Reading hierarchy:** The roles of main text, emphasis, and supporting information, including how ordinary sentences without emphasis appear.
- **Visual language:** Letterform characteristics, font pairing, primary-to-secondary proportions, colors, background blocks, and placement anchors, based on the Design Style, static reference, or footage already inspected.
- **Motion rules:** Which word onsets, phrases, pauses, or sentence endings trigger changes, and when the composition stays still.
- **Variation:** Which sentences share the baseline treatment and which merit a whole-card title or a different composition.
- **Capacity:** How short phrases, long phrases, and long words fit, and how wrapping or pagination handles overflow.

For example, a dense explanation may benefit from stable phrase layouts with hierarchy changes at important points. A short video with a strong rhythm may use whole-card compositions for key sentences, with ordinary captions before and after providing contrast. These illustrate possible directions, not fixed templates to assign by genre. First make a representative segment using actual text, then extend it across the requested scope.

A design does not need a different animation for every sentence. Variation should support meaning and rhythm. Ordinary sentences, still moments, and measured space make emphasis effective.

## Caption Content and Visual Hierarchy

### Separate Meaningful Emphasis from the Currently Spoken Word

Word highlighting answers “where are we in the speech?” Semantic emphasis answers “what matters most in this sentence?” Color, size, and whole-card themes can also serve independent design purposes; they do not all have to follow the same word.

Read the complete meaning when choosing emphasis for the current video. Preserve negation, conditions, units, and contrasts. In “not faster, but more stable,” turning “faster” alone into a giant headline can change what viewers take away. The contrast needs to survive both the layout and its timing.

For reusable templates, prefer emphasis markers already supplied by the runtime, preserving manual selections and explicit suppression. Automatic markers are heuristic suggestions, not proof of semantic understanding. Without semantic markers, use a consistent treatment or deterministic layouts based on length and pauses. Do not describe random selection or always choosing a particular word position as semantic understanding. When semantic choices are needed, the agent should make them for the actual content and express them through available parameters or markers. Custom code must render those markers explicitly; outer caption CSS and style-span animations are not automatically painted over a custom renderer.

### Choose the Appropriate Treatment Level

| Level                 | What it can express                                                         | What to check                                                                               |
| --------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Word or character     | Spoken-word tracking, conceptual emphasis, texture within lettering         | Accurate timing, intact word forms, relationship to the main text                           |
| Line group            | Contrast, progression, primary and supporting information, phrase structure | Natural word groups, alignment, spacing, and rearrangement                                  |
| Whole caption card    | A conclusion, title, mood, or section change                                | Coherent composition, reading time, and rhythm with adjacent cards                          |
| Full-screen text card | A complete idea or chapter transition                                       | Background coverage, text safe areas, and the amount of footage the user allows it to cover |

Mixing fonts within a sentence and changing fonts for an entire card are different designs. Supporting text shrinking only after a main word arrives is also a temporal relationship. Do not reproduce only the final state by making the supporting text small from the start.

Subject occlusion, cutouts, and shot collages require additional media or compositing capabilities. Include them only when needed for the task and supported by the environment, and verify how they combine with captions. Shared `caption_v1` access does not enable Web-only vision or raw-transcription protocols on Desktop.

## Typography, Layout, and Readability

### Choose Fonts by Role

Compare actual letterform structure, width, weight, upper- and lowercase proportions, serifs, and italics rather than relying on font names. Define clear relationships between main text, key words, and annotations. A second font need not appear in every sentence. Confirm that the intended fonts actually load, and provide suitable fallbacks for the target language.

Adjust font family, weight, horizontal and vertical proportions, and size separately. When the user asks for “flatter,” “heavier,” or “smaller,” identify the relevant property first. Stretching, italics, and local capitalization must be reflected in measurement; wrapping calculations and drawing must use the same treatment.

Different languages can use different fonts to preserve similar visual roles. Displaying Chinese successfully does not establish a stylistic match. Check weight, stroke density, visible glyph height, and primary-to-secondary proportions separately. Do not apply Latin-letter stretching parameters indiscriminately to Chinese glyphs.

### Preserve Natural Phrases and Readable Scale

Calculate layout with the final fonts, weights, displayed case, and spacing. Character counts only estimate capacity. Kerning can differ between whole-word rendering and separate character elements. Preserve natural word groups and avoid breaking ordinary words into fragments. Where supplied, use `wordGroupId` to keep tokens of one word together for wrapping while retaining each token's timing; do not assume every CJK token is a complete phrase.

Give each typographic role a size range appropriate to the target aspect ratio, and check readability at the actual viewing size. When a long phrase does not fit, examine the available area, phrase grouping, line count, and pagination allowed by the design. Do not keep shrinking the entire group indefinitely. Short words should not grow without bounds either. An unusually long unbreakable string may need a specific fallback, but that fallback should not become the rule for ordinary sentences.

Single-line, two-line, equal-width two-line, and primary/secondary layouts need different capacity strategies:

- Paginate an overflowing single-line design at whole-word boundaries, retaining the display timing of later words.
- For two lines, find a sensible phrase break first. Use independent sizes or small spacing adjustments as the design requires, constrain the size ratio, and avoid stretching a short line excessively.
- Allocate width and height jointly across primary and secondary regions. Reserve readable space for supporting text rather than giving everything to the main word and squeezing the rest afterward.
- Decide line wrapping separately from reveal groups. A new aspect ratio requires layout changes, but should not arbitrarily choose new emphasis or change reveal rhythm.

### Check Actual Glyphs and Motion Bounds

A font's line box is not its visible glyph bounds. Include descenders, italic overhang, outlines, shadows, glows, rotation, and maximum animated scale in boundary checks. Do not hide layout errors with clipping containers.

Calculate spacing within a line group separately from spacing between primary and secondary groups, using the final effective font sizes. Avoid counting font line-box whitespace, container padding, and extra gaps repeatedly, then compensating by shrinking everything. Apply each safe margin only at the level responsible for it.

Anchor captions relative to the effective caption region and its placement in the target canvas. Verify landscape, portrait, and square formats when they are actually required. Resizing the preview window should not change the design. Keep the overall text block stable; word visibility changes should not accidentally make it drift vertically.

## Tie Motion to Content Events

Describe the state before the event, at its trigger, during the transition, and after it settles before choosing curves. Identify what changes, what stays still, and how the animation continues if the next word arrives early. Bind motion to actual word, phrase, or card timings rather than fixed demonstration text or absolute seconds in a particular video.

Separate “when content appears” from “how much appears at once.” Words, phrases, lines, or whole cards can appear together according to the design and speaking pace. Even phrase-based reveals must preserve word timing and avoid disclosing later speech conspicuously early. Keep every word visible in its intended sequence after pagination; do not alter speech timing to accommodate animation.

Design entrance, hold, and exit separately. Position, opacity, and blur need not share a curve. A soft focus transition does not inherently need upward movement. Leave enough time to read; shorten transitions or simplify the treatment for brief cards. Animation within a card does not require a transition between cards.

Use these mechanisms when they serve the design:

- **Word-by-word reveal:** Retain words already shown and decide whether future words reserve space. Treat visibility and highlighting independently.
- **Primary/secondary rearrangement:** Let supporting text appear at a normal size, then shrink or move it when the main word actually starts. Both stages must remain readable.
- **Word-following background:** Move and resize the background continuously between words. During rapid speech, continue from an intermediate state that can be recomputed from time instead of jumping back to the previous word's endpoint.
- **Line-by-line background:** Space may be reserved ahead of time, but the background's visibility should follow that line's reveal rule rather than showing an empty bar early.
- **Whole-card changes:** Let composition and theme follow the relationship between passages. Do not rotate treatments at fixed intervals merely to create variety.

Derive all changes from the current time and stable inputs. The same frame should look the same during forward playback, seeking, and backward scrubbing. Seed decorative variation with stable card or word identities when randomness is useful. Do not depend on playback history or redraw the entire font and material selection because wrapping changed the text groups. Use complete-source `sequence` context when available, with a deterministic fallback when older payloads omit it.

Check consecutive events, not just isolated animations. When another word arrives quickly, do position, size, and centering continue naturally? Does an exit hide text that still needs to be read? Does scrubbing restore the correct state?

## Make Color and Material Support Reading

Design text color, background color, outlines, hard shadows, opacity, and soft glows separately. Check them over light and dark areas of the actual footage, not just solid preview backgrounds. Brightening and increasing saturation are different adjustments. Preserve primary/secondary relationships and colors the user has accepted.

Size background blocks around the final glyphs and line groups. Let padding, corner radii, and outlines scale sensibly with the block. Recheck visual balance above and below the text after a font change, an added line, or a size adjustment. Blur may serve an entrance focus effect, but the stable reading state should have the clarity intended by the design.

Investigate hand-drawn or collage mechanisms only when those materials are needed:

- A hand-drawn appearance may come from the font, repeated strokes, offset layers, or grain. Static irregularity does not imply continuous jitter or require a handwriting animation.
- For path-based strokes, keep variation continuous along the stroke. Independent noise at each sample can create jagged edges. Check whether intersections turn into burrs or solid blobs.
- Custom vector lettering needs coverage and fallbacks for the target characters, not just the demonstration words. Sparse glyphs, dense glyphs, and new sentences must all remain readable.
- For paper cutout lettering, measurement and drawing must use the same fonts, padding, and rotations. Budget stable layout and maximum animated overhang separately, rather than giving every word an entire entrance margin of its own.

Judge the overall material at the actual playback size. Fine strokes in a close-up do not guarantee enough visual weight for the whole letter, and texture must not make the main text hard to read.

## Add Recreation Steps When There Is a Motion Reference

Play the complete reference range specified by the user to understand its rhythm. Use representative frames to identify layouts, and adjacent frames to examine entrances, holds, and rearrangement. With screenshots alone, analyze static features and describe any unverified motion as a design choice. A supplied reference does not require finding a different style to replace it.

Identify the few relationships that most strongly determine resemblance: letterform structure, primary/secondary proportions, alignment, color and material, reveal groups, and change triggers. Distinguish word, line-group, and whole-card treatments. Note where important treatments occur and how they should adapt to new text. Also examine ordinary cards with no animation or font change so that occasional featured moments do not become the default for every sentence.

Start with a local comparison using the same short text and a similar visible glyph height to establish the font and motion mechanism early. An immediate appearance, staggered letters, and drawn strokes may have similar final frames. Compare the moments before and after appearance and the hold state before implementing one. If the main mismatch is still in letterforms or timing, do not mask it with extra decoration.

Once the local treatment works, substitute the user's actual captions and review the complete segment. Preserve the reference's design relationships while adapting wording, speech timing, aspect ratio, and subject placement to the current content. Specific words, person coordinates, or timestamps from the reference must not become default conditions in a reusable template.

If the original font is unavailable or the target environment cannot produce an effect, explain the specific difference and choose an alternative that preserves the main characteristics. When scene compositing from the reference is outside the task, distinguish the scope of caption recreation from recreation of the entire image.

## Implement Editable, Reusable Captions

Create and bind templates through the caption-template capabilities supported by the current environment. Keep the template attached to real captions so it reads their actual text, timing, effective geometry, and available emphasis information through that host's contract. Do not substitute an ordinary MG overlay containing hardcoded text for a caption template.

Follow the protocol supplied by the current tools. Check time units and the distinction between card-local time and absolute timeline time: `caption_v1` cue/word bounds and `active.frame` are absolute timeline frames, while Remotion `useCurrentFrame()` is Card-local; Desktop's legacy caption context uses Card-relative seconds. Desktop caption-read Card/token times are integer microseconds, while frame queries and timing-edit fields use project frames. Do not pass those editing API values directly into renderer clocks. Read the host's authoring reference for the full shape and use the actual fps. A standalone preview without caption context may use sample text; a template bound to real captions must use actual input. Display text is already transformed in current `caption_v1` payloads; render supplied text without reapplying punctuation/case settings. Raw style-span offsets address `rawText`, not transformed text. Layout must measure the final displayed text without rewriting the source transcript.

Expose useful controls for fonts, colors, primary and secondary sizes, placement, and motion through supported renderer properties and native layout controls. Persist source, property definitions, values, and layout through the host's own workflow; do not assume they form one portable object or that every host can publish a catalog entry. Reuse one source across different sentences, varying it through parameters or explicit treatment choices rather than copying code for every card. Change parameters first when the user only wants a color adjustment; change the relevant source when the composition mechanism needs to change.

Explicit card settings, track settings, and template defaults may override one another according to the host's inheritance rules. If an edit appears to have no effect, inspect the template actually in use and the active overrides. Preserve manual emphasis, suppression, locks, and settings on captions outside the requested scope. Do not reset all captions to solve a local issue. Re-read captions after edits that can regroup Cards, rather than reusing stale Card IDs.

On Desktop, template selection inherits from caption item to track to Card. `template:null` explicitly renders ordinary captions; removing the local override restores inheritance, while omitting it in a merge preserves it. The local entry path references source without copying it, so keep its files available for playback and export. On Web/backend, `code:null` clears the scoped renderer to inherit the parent/preset. Do not transfer these reset operations between hosts.

A reusable style should have a complete default result without requiring its author to patch every card. Provide sensible layouts and fallbacks for new content, then allow the agent to tailor the treatment to a particular video. Preview and application should use the same rendering logic, but host parity still needs verification. Shortening an audition or starting halfway through must not turn the same card into a different composition.

## Review and Deliver on Real Captions

Check the target languages, aspect ratios, and runtime required by this delivery. Verify that source wording and word timings are preserved and that no words are missing or duplicated across the requested scope. Then inspect short phrases, long phrases, long words, emphasized sentences, and different backgrounds in the actual footage. Motion review includes word changes, card boundaries, rapid speech, maximum overhang, and backward scrubbing. Watch continuous playback to judge reading time and rhythm.

For a reusable style, also try different content to establish that the result does not depend on the authoring sample. Verify each requested language or aspect ratio. State what remains untested rather than expanding every single-video edit into an all-platform test campaign.

Read back and reapply the saved result when relevant to confirm that text, parameters, and bindings remain correct. Inspect the target output when export is required. Source validation, successful saving, geometric containment, and visual quality establish different things. Web playback does not establish Desktop or export results.

When revising, locate the relevant relationship before changing it:

| Feedback                                         | Check first                                                                                         |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Text is too small or long phrases are clipped    | Actual available area, glyph measurement, phrase wrapping, minimum font size, and animated overhang |
| Supporting text is squeezed out by the main word | Primary/secondary space allocation, sizes before and after the change, and duplicated spacing       |
| Motion feels harsh or jumps                      | Event continuity, interpolation starting states, future-word space reservation, and time bases      |
| The original character has been lost             | Changes to font pairing, spatial regions, tilt, material, or whole-card variation                   |
| Changes revert or fail when reused               | The bound version, saved properties, override relationships, and source-content changes             |

These are diagnostic directions, not fixed repair formulas. Change the level identified by the user's feedback, then revisit relevant short and long phrases and treatments that were already working. Keep a previous version available for comparison when changes are substantial. On delivery, briefly state what changed, where it can be adjusted, and which relevant checks remain incomplete.
