# Release notes

Field: `extensions.com.openai.publication.release_notes` in [package/plugin.json](package/plugin.json). The field is optional in the ZIP, but release notes are necessary at submission [O1]. Keep the two copies the same.

## Version 1.0.0

> First release of King Down in ChatGPT. Play King Down chess against the computer at four levels, against a friend with an invitation code, or against a random player. See your active games, your rating, totals and badges. Offer a draw, resign or cancel a game from the chat.

Decision 2026-10-17: the listing needs no note about the change from plain short codes to HMAC short codes. This is the first ChatGPT release, so no ChatGPT player has an old code. Website players get the note in `docs/specs/chatgpt-mvp/release/RUNBOOK.md` (Release notes: server limits and codes).

For a later upload, increase `version` in `plugin.json` (error `plugin_version_unchanged` [O4]) and write what changed.
