# OpenAI submission packet

Drafts for the King Down ChatGPT plugin review. The owner reviews and submits; agents submit, deploy and sign in to nothing. Ticket: `docs/specs/plugin-submission/issues/09-submission-packet.md` (on branch `claude/plugin-ui-iphone`).

| File | What it holds |
|---|---|
| [checklist.md](checklist.md) | Every OpenAI requirement, its status and the next step. Start here. |
| [package/](package/) | The ZIP contents: `plugin.json`, `mcp.json`, `assets/logo.png`, one skill. Placeholders in `<ANGLE BRACKETS>`. |
| [test-cases.md](test-cases.md) | The 5 positive and 3 negative review cases, with their source in the code. |
| [listing.md](listing.md) | The listing text, with each field's limit and length. |
| [release-notes.md](release-notes.md) | The release notes for version 1.0.0. |
| [privacy-additions.md](privacy-additions.md) | Paragraphs to add to `public/privacy.html` after the owner's approval. |
| `public/support.html` | The support page for `supportURL`; live after the next deploy. |

The text in `plugin.json` is the copy that OpenAI imports. When you change a test case, the listing or the release notes, change both copies.
