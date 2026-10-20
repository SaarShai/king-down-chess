# Publish engine archives explicitly

Type: task
Status: resolved

## Plan and scope

1. Keep ordinary runtime builds read-only against `engines/`: verify the current pair and copy supported workers to the output. A missing pair stops with the publication command.
2. Add `npm run plugin:archive:runtime` for deliberate publication of the existing worker/save pair. Validate its fingerprint and fixture, keep exact repeats safe, and reject inconsistent or incomplete existing files without overwrite.
3. Use the existing mocked-dependency and temporary-folder test conventions to prove missing-pair refusal, source archive immutability, copying and publication guards. Run focused `npm test` only after the main task frees the shared lane.

This is the first bounded U08 slice. It changes no engine semantics, published archive, deployment guard, save format, registry or loader. Browser legacy saves, stored-engine previews, setup across releases and rollback rehearsal remain separate checks.

## Verification

- Ordinary builds with a missing pair fail without creating source archives.
- Ordinary builds with supported pairs copy the worker files and leave every source file byte unchanged.
- Output folders that equal, contain or sit inside the source archive are refused before the build removes any output.
- Explicit publication validates the worker fingerprint and save identity, creates both files, and permits an exact repeat without writing.
- Existing partial, changed or malformed pairs are refused and retain their bytes.
- Run the focused build/archive tests through the shared `npm test` lock. No standalone build, browser check or deployment is in this slice.

## Evidence

`KINGDOWN_TEST_FILE='tools/{plugin-runtime-build,engines}.test.ts' npm test` with the disposable loopback database passes all 163 focused build/archive tests, typecheck and 54 artwork checks. Log: `/tmp/kingdown-u08-archive-publication.log`. The build tests mock Vite and use temporary folders. They prove source bytes and modification times stay unchanged, as well as the explicit publication path and its refusal checks. Existing archive continuation tests still pass.

Ordinary builds now stop at a missing current pair and name `npm run plugin:archive:runtime`. That explicit command builds the existing runtime and fixture, validates their identities, creates files with exclusive writes, then runs the ordinary checks/copy. An exact existing pair only verifies; an incomplete or changed pair stops without overwrite. If creation of the save fails, publication removes only the worker file it just created. Process interruption can leave an incomplete pair; the next call refuses it rather than replacing a published file.

Base: `6479ab02`. No published archive bytes or engine source changed. No standalone build, browser check or deployment was run. The main task owns integration and later compiled/release checks. This slice does not complete U08's setup, preview, local-save or rollback acceptance.
