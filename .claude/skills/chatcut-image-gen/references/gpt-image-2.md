# gpt-image-2 (OpenAI)

Read this document before generating images with `model: "gpt-image-2"`.

## Capabilities

- Strong text rendering — legible headlines, labels, packaging, UI mockups
- Strong prompt adherence — follows complex layout and composition instructions precisely
- Max 10 reference images (ChatCut cap)
- Prompt: at most 32,000 characters (OpenAI rejects longer prompts)
- Supports `quality`: `auto | low | medium | high` (default: `high`)

## Params

| Param                                 | Values                                | Default | Notes                                                                                  |
| ------------------------------------- | ------------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| `quality`                             | `auto`, `low`, `medium`, `high`       | `high`  | `xhigh` / `max` need Image 2.5                                                         |
| `imageSize`                           | `1K`, `2K`, `4K`                      | `1K`    | 4K (3776×2128 at 16:9) is above 2560×1440, which OpenAI marks experimental; costs more |
| `aspectRatio`                         | 10 ratios (see SKILL.md)              | `16:9`  | Computed to exact pixel dimensions                                                     |
| `referenceAssetIds` / `referenceUrls` | project image ids / public image URLs | —       | Up to 10 in total; PNG, JPEG or WebP                                                   |

## When to Use

- Text-heavy images: titles, logos, infographics, UI screenshots
- Prompt-sensitive layouts: precise positioning, composition, or style adherence
- Product mockups, packaging, or any design with readable text
- When fidelity to the prompt matters more than matching reference images

## When NOT to Use

- When reference-image fidelity is critical (use `nano-banana` instead)
- When >10 reference images are needed (use `nano-banana`)

## Prompt Tips

- Be specific about text content: quote exact strings to render (e.g., `"a poster with the headline 'Summer Sale 2026'"`)
- Describe spatial layout explicitly: "centered title at the top, product image below, price tag in the bottom-right corner"
- For multi-element compositions, describe each element's position relative to others
- Include style descriptors: "flat design", "photorealistic", "watercolor", "3D render"
- Specify background explicitly when it matters: "on a pure white background", "against a gradient from blue to purple"
- For text-on-image edits with references, describe what to change and what to keep: "replace the text on the sign with 'Hello World', keep everything else the same"
