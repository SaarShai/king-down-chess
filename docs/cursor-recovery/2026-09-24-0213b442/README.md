# Cursor recovery — 0213b442 — 2026-09-24

**Follow-up executed:** the owner then requested implementation. [EXECUTED.md](EXECUTED.md) records the selective adoption, current checkout and fresh verification. The collection account below describes the earlier recovery phase.

Collection and assessment only at that phase.  No previous agent, simulation, training job, development server, test suite, implementation task or publication was started or resumed. Product files and existing research remain as found. This record supersedes **completion claims**, not the owner's game-design decisions.

**Recommendation:** preserve everything as evidence; selectively adopt useful behavior onto the accepted `codex/playable-clay` version. Do not merge the `takeover` working tree wholesale. Keep the experimental drop work outside the playable game, and replace the mass of incidental test observations with a small set of meaningful regression cases.

## What was recovered

| Evidence | Collected |
|---|---:|
| Parent transcript | 1 |
| Child transcripts, matched exactly to Cursor's child registry and launches | 887 / 887 |
| Child models recorded in launch metadata | 886 Grok 4.7 + 1 Fable 5.1 |
| Cursor conversation records | 888 composer records, 34,358 bubbles, 25 checkpoints |
| First-edit content snapshots | 916 / 916 |
| Original dirty workspace | 24 tracked changes + 861 untracked files |
| New test files | 801, containing 33,868 lines |
| Dated research reports | 21 |
| Simulation datasets | 23, containing 880 game records |
| Simulation specs / summaries / reports, alongside raw games | 9 / 23 / 2 |
| Recovered browser screenshots | 9 |
| Existing referenced temporary files | 37 |
| Referenced Cursor tool/terminal files | 87 / 87 concrete paths |
| Removed source probes with recovered Write payloads | 9 |

All 887 child transcripts end in `success` and their composer records say `completed`. That means the child **turn** ended, not that the software is ready. The parent stopped with repeated usage-limit errors. Several final results were never incorporated into a closing handoff; those results are included here.

The parent's last substantive action was to request the Beast-chain recapture comparison. Child `bfad39ca-a34e-46fc-92de-af789d6ac36f` finished: the king captures the hanging Beast on d5 for a draw score; after the safe c4 landing it instead plays `Ke6-f5` with a negative score. Other last results include Paladin-pawn restore/undo and the correction that a Paladin **cannot capture an immune Guard**. These are observations, not new rules.

## Read the assessment

- [ASSESSMENT.md](ASSESSMENT.md): keep, repair, hold and archive decisions; concrete defects and verification limits.
- [ADOPTION.md](ADOPTION.md): the original ordered plan and acceptance criteria. [EXECUTED.md](EXECUTED.md) records its implementation.
- [RESEARCH.md](RESEARCH.md): all 21 reports, conversation-only research, dataset census and corrections.
- [FABLE.md](FABLE.md): the 11 suggestions, what actually landed and what remains useful.
- [agents.tsv](agents.tsv): every agent, its full final text, model, files and retention decision. [agents.jsonl](agents.jsonl) adds prompts, source hashes, precise provenance and saved-record status.
- [files.tsv](files.tsv): disposition of each of the 885 original dirty-workspace paths.
- [runs.json](runs.json), [saved-checks.json](saved-checks.json), [verification.json](verification.json): the evidence behind counts and completion limits.

## Preservation and scope

The private local evidence archive is [2026-09-24-0213b442](/Users/za/Documents/king-down-chess-recovery/2026-09-24-0213b442). It contains raw transcripts and relevant SQLite records, full tool results, original and current source copies, temporary analyses, raw games, deleted texture bytes from Git, removed probe payloads and screenshots. It also contains `baseline-62c9084.tar.gz`, a complete tracked-file snapshot of the starting commit; overlaying the archived workspace and honoring its three deletion records reconstructs the recovered working source without relying on Cursor. Archive instructions describe this process but do not execute it. The archive's `MANIFEST.json` records hashes. Raw conversation/application records stay outside Git; the archive directory is private to this user.

The archive also preserves the existing `dist` and `dist-review` trees (145 files / 4,444,884 bytes each). They are inherited artifacts, **not a production build of the recovered Cursor changes**. The session has no recorded production build, commit or publication. The source is recoverable even if Cursor history or `/tmp` is later cleared.

Source: `/Users/za/.cursor/projects/Users-za-Documents-king-down-chess/agent-transcripts/0213b442-49e7-4cf4-b8b7-f9156eaec088`, reconciled with read-only queries of Cursor's `globalStorage/state.vscdb`. Initial Git state: `takeover` at `62c9084bf5a9d80b0c10218ce3898c54ad1b3528`. Collection cutoff is recorded in [collection.json](collection.json); dates in this folder use the owner's America/Los_Angeles date.

Explicit gaps: three referenced `/tmp` files were already absent; their available commands/results remain in the raw records. All 87 concrete referenced Cursor tool/terminal files were preserved; an additional reference was a wildcard, not a missing file. Historical simulation source fingerprints are preserved, but runnable source trees for each fingerprint have not been reconstructed. No new external research, replay, balance measurement or release verification was performed. All recorded children are accounted for; this is not a claim that unknown or already-deleted external artifacts can be recovered.

A separate recorded side effect: the parent enabled gstack's user-level `checkpoint_mode: continuous` after its checkpoint prompt and created two gstack prompt markers. The setting is still present. No WIP commits were actually found in this session. This recovery did not change that setting.

Collection verification passed **25 checks**: transcript/registry/launch agreement, hashes and parsing, complete outcome/file indexes, baseline Git blob identity, preserved raw games and inherited builds, resolving report links and unchanged original source/data. Product verification remains limited to the historical evidence above. Only this recovery folder and recovery entries in `TASKS.md` / `LESSONS.md` were added to the project.
