# Matte halo screen

Status: claimed

## Plan and checks

- Compare each matte-coloured edge pixel with its nearest opaque interior colour.
- Keep the 30 percent edge limit. Test a matte rim and clean dark art.
- Measure each frame in the named failed banks and ten passing banks. Record before and after values.
- Run the focused animation bank tests. Open a PR to staging and check CI.

## Evidence

- The matte rim fixture fails. The clean dark edge fixture passes.
- All five keys-fix failures and all 12 offline failures pass the new screen.
- Ten passing offline banks stay below the limit. Each check reads all saved frames.
- `KINGDOWN_TEST_FILE=tools/animation-bank.test.ts npm test` passes 8 selected tests and 68 bundled checks.
- The screen needs a visible colour difference from the opaque interior. A dark rim on dark art can escape it. Check the preview.
