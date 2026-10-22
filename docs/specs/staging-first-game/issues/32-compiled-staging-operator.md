# Check the compiled staging support tool

Type: task
Status: complete for compiled preparation; live handling remains open
Parent: U07 and U09

## Plan and acceptance

1. Reuse the existing moderation CLI and SafetyService. Build a standalone Node artifact with the existing build dependency. Add no new service, public route or moderation logic.
2. Keep source execution limited to disposable loopback databases. Only the compiled artifact may accept the exact separate staging database, using verified TLS. Reject production, other projects, URL overrides and player runtime roles before constructing a connection.
3. Run the existing CLI support intake, action and appeal journey against both source and compiled paths on a disposable database. Prove notices reach only the affected account, evidence remains private, and output escapes terminal controls.
4. Record artifact hashes and focused test results. Do not send support mail, change real player restrictions, deploy a website or claim mailbox handling. The owner handling rehearsal remains a separate gate.

## Scope

Owned files: tools/mod.ts, its database configuration and build helper/tests, the existing accounts database CLI test, package script and artifact ignore entry. SafetyService accepts the staging appeal text at construction; its default text stays unchanged. Game rules, UI, archived engines, production and the accepted staging game artifact remain unchanged. The exact compiled tool must pass its checks before any later authorized staging use.

## Verification

The existing source command and the standalone compiled command both pass the real disposable PostgreSQL intake, queue, warning, appeal-open, appeal-reversal and notice checks. The compiled process runs outside the repository without source or installed project dependencies. Source runs reject remote staging even when an environment variable attempts to enable the compiled switch. The compiled command rejects production and connection overrides. TLS configuration checks require certificate verification and the exact staging admin identity.

Three selected files pass 61 tests, typecheck and 54 art checks, with no required skips. A later selected compiled journey adds artifact-level production/override refusal and passes one case; 15 other cases are filtered. Typecheck and 54 art checks pass again. The first attempt fails typecheck on importing the JavaScript builder into a source TypeScript test. Invoke its actual CLI instead; no declaration shim is needed.

Review finds the inherited notice points to production help. The staging operator now supplies the staging appeal text to the existing service. Tests assert the affected player receives this link and private evidence stays absent. Default service callers retain their current behavior. No game UI or deployed artifact changes.

The preserved tool contains `mod.mjs`, the existing CA certificate and a hash manifest. Its module SHA-256 is `2634ce876bfa9ea9781b9bd88e99d24522b135bf6969a6476f6c685363a5b8bd`. A source-free read-only list smoke passes against the disposable loopback database. Parent evidence: `evidence/staging-operator/receipt.json` and its logs/artifact. [Operator instructions](../../../staging-support-operator.md).

No hosted database connection, moderation action, email or public release occurs. Mailbox delivery, manual identity checks, owner handling and appeal delivery remain open. This result supplies the missing checked compiled path; it does not close those operational gates.

The final documentation check passes 161 cases in 13 files. A final diff review confirms that the existing commands and service remain shared, source execution stays local-only, and default service behavior does not change. No new worker, public route or host-specific game path is added.
