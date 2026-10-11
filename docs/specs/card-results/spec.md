# Card results
Owner approval: 2026-10-11: "merge all the results onto the card, make it authoritative, update the tools and shared agent instructions to store results there, and set up verified Google Drive backups. preserve anything unique"; include M1 results.

The card root `/Volumes/card disk/King Down/results` is authoritative on the owner's main Mac. Runtime tools use one configured result root and fail when its card is absent. Git-tracked reports remain as historical test evidence; they do not select the runtime output root. M1 and cloud runs keep machine-local spools; verified collection brings them into the card root. Same-path different-content files remain in a variants directory with source provenance; streams from different runs are never concatenated.

Verification: content hashes for each imported file, decompressed comparison for old Drive backups, explicit conflict preservation, M1 identity check, result-path and merge tests, full npm test, verified incremental Google Drive snapshots with immutable compressed objects and restore hashes, daily collection/backup schedule. No simulation is launched. No source collection is removed during this migration.
