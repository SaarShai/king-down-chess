# Title scroll

Status: resolved

## Finding

Review 1, F5: At 852×393, the title hides the account note. The dialog does not scroll.

## Plan and checks

1. Add a browser check. Save the title at 375×812, 320×568, 852×393, 768×1024, 1280×800, and 320×200.
2. Show that the check fails. Let short landscape titles scroll. Extend the landscape rule to 899 px.
3. Run the focused tests, docs checks, and title and Home browser checks. Compare the images. Commit this fix.

The account note must be in view or reachable by scroll. Other normal sizes must stay the same.

## Fix and proof

- Extend the existing landscape rule from 720 px to 899 px. It keeps scroll and the compact title in one rule.
- Red: `npm run check:browser layout-title` fails at 852×393. Content is 447 px high; overflow is hidden.
- Green: `KINGDOWN_TEST_FILE='src/first-deal.test.ts' npm test`, `npm run test:docs`, and `npm run check:browser layout-title home` pass.
- The full account note fits at 852×393. Wheel and touch scroll show it at 320×200.
- The other four normal title images have zero changed pixels. The initial 320×200 image also stays the same.
- The output report holds the images, logs, and pixel counts. The fix changes no UI text or selector.
