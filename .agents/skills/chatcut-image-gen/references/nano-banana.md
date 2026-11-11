# nano-banana (Nano Banana Pro, Gemini 3 Pro Image)

Read this document before generating images with `model: "nano-banana"`.

## Model

| Model         | Max refs | Strengths                                            |
| ------------- | -------- | ---------------------------------------------------- |
| `nano-banana` | 14       | Best reference-image fidelity; strong text rendering |

## Params

Nano Banana does NOT support `quality` or a transparent background. Only shared params apply:

| Param                                 | Values                                | Default | Notes                                                                                          |
| ------------------------------------- | ------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `imageSize`                           | `1K`, `2K`, `4K`                      | `1K`    | Fixed sizes, e.g. 16:9 is 1376×768, 2752×1536 or 5504×3072; 4K costs more                      |
| `aspectRatio`                         | 10 ratios (see SKILL.md)              | `16:9`  | —                                                                                              |
| `referenceAssetIds` / `referenceUrls` | project image ids / public image URLs | —       | Up to 14 (up to 6 objects, 5 characters, 3 styles); PNG, JPEG, WebP or HEIC, 7 MB each at most |

## When to Use

- Reference-heavy tasks: "make an image in the style of these examples"
- When the user provides >10 reference images (gpt-image-2's limit)
- Style transfer, character consistency across multiple images
- Compositing multiple source images into one scene

## Prompt Tips

- With reference images: describe the relationship between references and desired output — "combine the style of the first image with the subject of the second"
- Reference images drive the output strongly — keep the text prompt focused on what to change, not what to copy
- For style transfer: "in the style of the reference image" works well
- For composition: describe the scene structure; Gemini follows spatial descriptions but less literally than gpt-image-2
- Gemini handles natural-language descriptions well — conversational prompts can work better than keyword-style prompts
