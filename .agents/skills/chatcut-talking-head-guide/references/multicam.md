## Multicam (multiple camera angles of the same take)

When the user has **two or more cameras recording the same moment** — cues like "both angles", "the same interview", "multi angles", "alternate angle", "cut to the other angle", "angle switch", 换角度, 两个机位 — switching to another angle means the picture changes but the **audio and lip-sync must stay matched** to the take.

**Do not estimate source offsets by eye.** Manual offsets drift wherever the underlying reference angle was cut, and the drift only shows up later as out-of-sync lips. Load the **`multicam-sync`** skill and follow its alignment steps: it measures each angle's offset against the reference from the shared speech and places every piece at that constant offset.

Key constraint: a **single cutaway clip that spans a cut in the reference angle** can't be aligned as one piece — split it at that cut with `split_item` first, then align each piece to the reference segment beneath it.

After placing the angles, read the project back to confirm the alignment.

---
