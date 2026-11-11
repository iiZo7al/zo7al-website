# Claude Code Elicitation Recipes

Use these recipes only after loading the current `visualize.show_widget`
`read_me` for the session. Let the current host contract override stale class or
shell details in this file.

## Contents

- Combined form shell
- Canonical media data gate
- Visual cards
- Avatar preview cards
- Voice audition cards
- Ordinary fields
- Submission and answer parsing
- Unsupported file input
- Host limitations

## Combined form shell

Render one widget containing every related field and one submit action. Use
user-language strings for every `data-name` and `data-value`; those strings
become the filled prompt. Keep internal preset and voice ids only in the
agent's label-to-id map.

<!-- prettier-ignore -->
```html
<form
  class="elicit"
  style="border:0; border-radius:0; box-shadow:none; background:transparent"
>
  <div class="elicit-header">
    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M11.586 2a1.5 1.5 0 0 1 1.06.44l2.914 2.914a1.5 1.5 0 0 1 .44 1.06V16.5a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.492-1.347L4 16.5v-13A1.5 1.5 0 0 1 5.5 2zM5.5 3a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h-2.5A1.5 1.5 0 0 1 11 5.5V3zm7.04 10.304a.5.5 0 0 1 .92.392c-.295.69-.871 1.304-1.66 1.304-.487 0-.892-.234-1.2-.574-.309.34-.713.574-1.2.574-.486 0-.892-.233-1.2-.574-.31.34-.714.574-1.2.574a.5.5 0 0 1 0-1c.212 0 .52-.18.74-.696l.034-.067a.5.5 0 0 1 .886.067c.221.516.528.696.74.696.213 0 .52-.18.74-.696l.035-.067a.5.5 0 0 1 .885.067c.22.516.527.696.74.696s.519-.18.74-.696m0-4a.5.5 0 0 1 .92.392c-.295.69-.871 1.304-1.66 1.304-.487 0-.892-.234-1.2-.574-.309.34-.713.574-1.2.574-.486 0-.892-.233-1.2-.574-.31.34-.714.574-1.2.574a.5.5 0 0 1 0-1c.212 0 .52-.18.74-.696l.034-.067a.5.5 0 0 1 .886.067c.221.516.528.696.74.696.213 0 .52-.18.74-.696l.035-.067a.5.5 0 0 1 .885.067c.22.516.527.696.74.696s.519-.18.74-.696M12 5.5a.5.5 0 0 0 .5.5h2.293L12 3.207z"/></svg>
    <span>Editing requirements</span>
  </div>
  <div class="elicit-body">
    <div class="elicit-group">
      <label class="elicit-question">Which edits do you need?</label>
      <div class="elicit-pills" data-name="Which edits do you need?" data-multi="true">
        <button type="button" class="elicit-pill" data-value="Speech editing">Speech editing</button>
        <button type="button" class="elicit-pill" data-value="Captions">Captions</button>
        <button type="button" class="elicit-pill" data-value="Motion Graphics">Motion Graphics</button>
      </div>
    </div>
  </div>
  <div class="elicit-footer">
    <button type="button" class="elicit-skip">Skip</button>
    <button type="button" class="elicit-submit">Fill in editing requirements</button>
  </div>
</form>
```

Copy the header SVG byte-for-byte. Use only CSS variables listed by the current
`read_me`; do not carry a remembered token list into a new session. Let the
Elicitation shell own the blue selected state; do not mutate selection classes
or ARIA attributes.

Claude Desktop's `show_widget` result already has a host-owned outer frame and
does not expose a frameless option. Keep `.elicit` for wiring, but use the exact
flattening style above so the form does not draw a second rounded card inside
that frame. Do not remove the header/body/footer structure.

## Canonical media data gate

Do not choose media first and name it afterward. Build each card from one
authoritative tuple, then use the tuple id to resolve media:

- Design Style: call `manage_design_style` with
  `action: "list_presets"` and the user's locale. Tuple = returned
  `(preset.id, preset.name, preset.description)`. Copy `preset.name` exactly;
  never infer a name from the thumbnail or shorten the returned name.
- Voice: call `manage_voice` with `action:"list"`, normally `voiceType:"all"`,
  plus the target narration language and conversation locale. Keep each tuple's
  type, name, summary, and selection fields together: official voices retain
  the returned `voiceRef`; custom voices retain `customVoiceId` + the exact
  `previewUrl`. Never replace the display name with a generic trait label.
- Avatar: follow `digital-human` to resolve ready public catalog identities.
  Keep each identity ID, name, `widgetPreviewVideoUrl`, and
  `widgetPreviewImageUrl` together. These are public CDN copies resolved by
  the server; provider `previewVideoUrl` / `previewImageUrl` are not usable in
  Claude's iframe. Never derive media from the name or ChatCut identity ID.
- Media: resolve `design-style/<preset.id>` and the official voice's returned
  `sampleMediaKey` (such as `voice/<voiceId>/ja`)
  through [widget-media.json](widget-media.json) beside this reference, only
  after the tuple exists. The Skill bundles this file without requiring a
  separate plugin installation. Custom voices remain label-only choices here;
  their runtime previews are not public manifest entries. The manifest supplies
  resource paths, not names.

Before `show_widget`, verify every visible label maps back to exactly one
authoritative tuple. Its media must use the matching manifest key for a Design
Style or official voice, or the public avatar's exact returned
`widgetPreviewVideoUrl` / `widgetPreviewImageUrl` on `cdn.jsdelivr.net`.
If a catalog lookup fails, stop instead of guessing.

## Visual cards

Resolve `design-style/<presetId>` through
[widget-media.json](widget-media.json). Resolve each `entry.path` against
`baseUrl`; never infer a plugin-root path.
Omit the image when the key is absent.

Use this exact responsive shape. `media-grid` and `media-card` are semantic
class names only; the host does not style them. Keep the inline layout rules or
the default pill chrome will stretch around the image.

```html
<div
  class="elicit-pills media-grid"
  data-name="Visual style"
  data-multi="false"
  style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; width:100%"
>
  <button
    type="button"
    class="elicit-pill media-card"
    data-value="Red and Black Industrial"
    style="min-width:0; width:100%; border-radius:12px; padding:0; overflow:hidden; display:flex; flex-direction:column; align-items:stretch; text-align:left"
  >
    <img
      src="https://cdn.jsdelivr.net/gh/ChatCut-Inc/chatcut-widget-media@115f757787461b9c43236c496bb18d5eaf188b30/widget-media/design-styles/PRESET_ID.jpg"
      alt=""
      style="display:block; width:100%; aspect-ratio:16/9; object-fit:cover"
    />
    <span style="padding:10px 12px; font-size:13px; font-weight:500"
      >Red and Black Industrial</span
    >
  </button>
</div>
```

Use 3 strong cards by default; expand up to 6 only for broader browsing or when
the choice genuinely needs that range. Use a wrapping grid and make images fill
their card width without hardcoded light/dark colors. Never use the original S3,
CloudFront, or `app.chatcut.io` thumbnail in widget HTML.

## Avatar preview cards

Keep the `digital-human` shortlist and its original identity-to-name mapping.
Use the same selectable non-button `.elicit-pill` pattern as voice cards so a
native video player can live inside the card. Set its media frame to 4:5, matching
ChatCut's native avatar picker; do not reuse the 16:9 style-image recipe. Use
`<video controls loop playsinline preload="metadata">` with the returned
`widgetPreviewVideoUrl` and `poster` set to `widgetPreviewImageUrl`. Both
must be the exact public CDN URLs returned by the official catalog. Style the video with
`display:block; width:100%; aspect-ratio:4/5; object-fit:cover`. With image-only
media, use the returned `widgetPreviewImageUrl` with the same frame. Omit
identities with neither public widget preview; never substitute an unrelated
portrait or use the provider/runtime URLs. Do not write handlers
or scripts to emulate native hover playback.

In the same `.elicit-pills` group, append a localized label-only create action
mapped to `create_avatar`, then an Other `.elicit-pill[data-other]` and the
adjacent `.elicit-other[data-for]` input, as in the voice recipe below. The
input's `data-for` must match the group's `data-name`. Other describes the
desired presenter for a refined catalog search; neither action selects an
identity or authorizes generation. Keep `show_widget` submission unchanged.

## Voice audition cards

For an official voice, resolve its returned `sampleMediaKey` through the manifest and keep
its returned `voiceRef` in the agent's label-to-tuple map. For a custom voice,
keep `customVoiceId` in that map and render its choice without an inline player;
audition in a supported host media surface or ChatCut. Keep
descriptions provider-neutral. After the user selects a custom voice, call
`manage_voice` with `voiceType:"custom"`, `action:"apply"`, and its mapped
`customVoiceId`; do not route it through the official selection flow.

Use the exact localized `name` and `summary` returned by `manage_voice`. The
description must not replace or rename the display label. Use one host-wired
non-button single-select card with its native audio player directly inside.
Claude Desktop delegates choice
clicks to the nearest `.elicit-pill` and collects that class by `aria-pressed`,
so the voice card itself may be a non-button element. This keeps `<audio>` out
of invalid button content while making playback part of the option. Clicking
the player also selects that voice; no script is needed.

Every voice recommendation/selection group keeps those audition cards and
also includes a label-only clone pill plus Other with its adjacent text input.
Localize the labels and placeholder. Use "Clone another voice" when a ready
clone exists; keep the localized clone label mapped to `clone_voice` in the
agent's context. Other returns different voice requirements. Neither action
gets audio or maps to a catalog voice, and neither is hidden by plan or quota.

```html
<div
  class="elicit-pills voice-grid"
  data-name="Voiceover voice"
  data-multi="false"
  style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px; width:100%"
>
  <div
    class="elicit-pill voice-card"
    data-value="RETURNED_LOCALIZED_NAME"
    style="min-width:0; width:100%; border-radius:12px; padding:12px; display:flex; flex-direction:column; align-items:stretch; gap:8px; text-align:left; overflow:hidden"
  >
    <span style="min-width:0; display:flex; flex-direction:column; gap:3px">
      <strong style="font-size:13px; font-weight:500"
        >&lt;returned localized name&gt;</strong
      >
      <small style="font-size:11px; color:var(--text-muted)"
        >&lt;returned localized summary&gt;</small
      >
    </span>
    <audio
      controls
      preload="metadata"
      src="OFFICIAL_MANIFEST_URL"
      style="display:block; width:100%; min-width:0"
    ></audio>
  </div>
  <button type="button" class="elicit-pill" data-value="Clone my voice">
    Clone my voice
  </button>
  <button type="button" class="elicit-pill" data-value="Other" data-other>
    Other
  </button>
</div>
<input
  type="text"
  class="elicit-other"
  data-for="Voiceover voice"
  placeholder="Describe the voice you want"
  hidden
/>
```

Repeat the playable `.voice-card` for each returned voice option, before the
two action pills. Include exactly one clone pill and one Other input in the
group, and keep `data-for` equal to its `data-name`. Submit through the form's
existing single `.elicit-submit` and wait for the user to send the filled
answer. Route clone and Other through the `voice` skill before attempting TTS.

Each playable card is both the single
selection boundary and the container for its player. Do not add a nested
selection button, a sibling player row, playback scripts, `data-audio-id`, or
hidden audio elements. Do not change the card's border or background inline;
the host's `[aria-pressed="true"]` style must remain visible.

## Ordinary fields

Follow the current `read_me` contract. Representative shapes:

```html
<div class="elicit-group">
  <label class="elicit-question">Target platform</label>
  <div class="elicit-pills" data-name="Target platform" data-multi="false">
    <button type="button" class="elicit-pill" data-value="YouTube">
      YouTube
    </button>
    <button type="button" class="elicit-pill" data-value="TikTok / Shorts">
      TikTok / Shorts
    </button>
    <button type="button" class="elicit-pill" data-value="Other" data-other>
      Other
    </button>
  </div>
  <input
    type="text"
    class="elicit-other"
    data-for="Target platform"
    placeholder="Please specify another platform"
    hidden
  />
</div>

<textarea
  class="elicit-textarea"
  data-name="Additional requirements"
  placeholder="For example: keep natural pauses and avoid rushing"
></textarea>
```

Use one Other control per field and keep it adjacent to its pills. Verify the
current `read_me` attribute spelling before rendering because this interaction
is host-wired.

`data-for` on an Other input must exactly equal the owning pill group's
`data-name`. Use one readable, unique `data-name` per field so the
filled answer line cannot merge two questions.

## Submission and answer parsing

Claude Code Desktop fills, but does not send, a line shaped like:

```text
<form header> details — <data-name>: <value> · <data-name>: <value, value>
```

The host joins groups with `·` and multi-select values with `, `. It does not
append custom prose. After the filled line appears as a real user message,
map each visible label back to the internal id from the candidate list and
continue without asking the same questions again.

## Unsupported file input

Do not add any file chooser or dropzone to an Elicitation form. Claude Code
Desktop currently locks a form containing one into a read-only summary without
filling any answers into the prompt, and the apparent attachment is not
available to the agent.

When source media is missing, keep the form for preferences only. Outside the
form, say in the user's language: "Please drag the file directly into the chat
input and send it to me." After the attachment arrives, import its readable
local path with Desktop's `push_asset` tool.

## Host limitations

- Submission fills the prompt box rather than sending directly; wait until the
  answer appears as a real user message.
- A rebuilt iframe returns to its initial display; there is no durable submitted
  state.
- Inline media comes only from the bundled manifest's allowlisted CDN or the
  official catalog's public `widgetPreview*` URLs. A runtime/custom preview URL
  does not gain iframe access merely because a ChatCut tool returned it.
- Keep private media out of the public CDN. Use a supported host media surface
  or ChatCut for private previews; keep clone, create, and Other branch actions.
- Reload the current `read_me` once per session. If the host contract changes,
  prefer the current contract.
