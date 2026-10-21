# Verify the existing app in Codex

Status: bounded gameplay proof passes in staging; actual-host interrupted-request recovery and cross-account privacy remain unverified.
Parent: U11

## Plan and pass criteria

Use the actual Codex MCP Apps side panel with the existing staging connection. Keep the same rules, service, account and screen code. This is an additional-host proof, separate from U05’s completed native ChatGPT check.

1. Bind the canonical profile and authorized game. Check the panel’s embedded engine stamp against the staging release.
2. Commit one legal turn through actual panel controls and inspect the authoritative result. Verify web parity on the same game when the browser is available; do not count a model-facing tool read as a web render.
3. Check navigation, Profile/settings return and fresh remount. Reuse earlier unchanged auth/privacy source and compiled evidence; label actual-host error/retry/privacy limits separately.
4. Record tested, unsupported and unverified behavior. Close only the scope the evidence supports. No host-specific fork, production publication or new credential belongs to this task.

## Starting evidence

Source `d92991cb` is live only in staging. The installed staging connector returns canonical profile `068deed1-a1bf-4b39-ba9d-a550bd25ec41`. The initial Codex panel reads game `1ccbc2a2-71f6-8b47-a4db-aede1260beed` with the five actions proved in web and native ChatGPT. The persisted command source labels all MCP clients as ChatGPT, so it cannot prove host identity; use the actual Codex panel and UI receipts.

## Accepted real-host checks

The Codex MCP Apps panel embeds engine `sha256:cdac045daa373bf2417f22e767b6099893928fb8a90b0580efd16b019b138a7d`. Its actual move picker stages the Maester swap c1–b1. One End turn commits it; the computer bishop e6 captures the Ogre on a2. The website opens that same game and shows all seven actions. Web then commits Maester b1–a2, taking the bishop; the computer replies h7–h5. The Codex panel and a fresh panel both show all nine actions, White to move, with no duplicate commit or Try again.

The panel returns through Play, Profile and Settings. Profile shows nine games, the same rating/record, badges and empty account notices. Settings shows the existing board and presence controls. No preference is changed. A scoped staging SELECT confirms revision 10, the White seat's canonical user ID matching the connector profile, and matching row/save engine identities. Model-facing game output remains a status summary; it does not return the board.

An actual staging connector call for a synthetic absent game returns `Game not found`, `INVALID_ARGUMENT`, `isError: true` and no private view. It creates no app panel. This proves the tool error contract, not an in-panel error or another player's redaction.

The parent evidence folder holds `codex-cdac-committed-turn.png`, `web-codex-cdac-parity.png`, `codex-cdac-roundtrip.png`, `codex-cdac-fresh-panel.png`, `codex-cdac-canonical-identity.png` and `codex-portability.json`.

## Limits and next gate

No product change, new host adapter, rule fork, account-service fork or deploy is needed. The shared auth, privacy and receipt tests remain applicable to unchanged service code. They do not substitute for a lost successful reply or cross-account switch exercised in this actual host. Those U11 checks remain open; the available UI controls do not provide a controlled request interruption. Do not add a debug product endpoint solely to force it. This is evidence for desktop Codex gameplay, not Meta, Claude, mobile or public-host submission.

## Interrupted-session follow-up plan

Resume on the accepted staging artifact. Use only existing host controls. If the host lets the operator leave while Sending is visible, reopen the same game and compare authoritative history and web rendering. Record whether interruption is observed before acknowledgement; a later close cannot be called a lost reply. Check that the action appears once. Preserve the earlier compiled receipt/idempotency evidence and leave any unobservable boundary open. Do not add a debug endpoint or modify an authenticated host request.

## Follow-up result

The staging open tool returns the active legacy solo game at move 6. The first selected panel is an older aborted Ranked game; it is not the newly opened app. After the owner expands the current app, its panel shows the correct account, March and Darkness powers, cards and all eleven saved actions. Those include the later native ChatGPT Maester swap g1–h1 and computer reply b7–c6. No game action or retry occurs in this follow-up.

The available panel control has no close or navigation API to interrupt an in-flight host request. Native control of the Codex window is disallowed. Screenshot capture times out for both the older panel and the current panel; the current panel's readable Moves dialog supplies history evidence only. These control limits do not establish a game defect or a lost-reply pass. Actual-host interruption and cross-account privacy remain open. The next independent task records existing hosted timing evidence in ticket 33.
