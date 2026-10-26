# Title scroll

Status: claimed

## Finding

Review 1, F5: At 852×393, the title hides the account note. The dialog does not scroll.

The independent review returns P2. The rule at 899 px also reduces the title text and piece images. It shows a cut hero board at 852×393 and changes 150,203 pixels. The title check does not catch these changes.

## Plan and checks

1. Add a geometry check for the hero, title text and piece images at 375×812, 320×568, 852×393, 768×1024 and 1280×800. Show that it fails on the current code.
2. Keep the layout rule at 720 px. Add a separate scroll rule through 899 px. Compare title images with `de2a724b` at all five sizes.
3. Fetch and merge `origin/staging/first-game`. Run the three named test files, docs checks and all seven named browser checks. Commit the fix and record the results.

The account note must be in view or reachable by scroll. All five normal title layouts must match the base outside scroll behavior. Keep this check with the scroll check.

## Fix and proof

- Keep the layout rule at 720 px. The separate rule through 899 px only sets `overflow-y: auto`.
- The new check uses base measurements for the hero board, title text and all 12 piece images at the five normal sizes.
- Red: `npm run check:browser layout-title` exits 1 on `69677e2d` with the new check. At 852×393, the hero, text and pieces fail. The other four sizes pass.
- Two captures of `de2a724b` match exactly at all five sizes.
- Green: `npm run check:browser layout-title` passes at all six sizes. It uses localhost port 4327. External browser requests are blocked.
- All five normal layouts match the base geometry. Four images match exactly. At 852×393, 29,122 pixels differ by at most 3/255. The fixed images match the base with only scroll enabled at all five sizes, with zero changed pixels.
- At 852×393, a 54 px scroll shows the full account note. Its bottom is at 357.08 px. Wheel and touch checks pass.
- The staging merge and final checks remain open.
- The output folder holds the images, logs and pixel counts. The fix changes no UI text or selector.
