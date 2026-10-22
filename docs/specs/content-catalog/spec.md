# Released card content

Status: U06 complete in staging. The accepted U05 matrix and integrated staging checks close this slice's final gate.

The U06 card slice stores the 21 released cards once. Each record has its existing stable ID, display name, release availability, painting or rule-picture reference, and behavior fixture ID. The deal order stays the same.

Setup admission, card names, card faces and Collection read this record. Contextual card text and costs stay in their current modules and continue to use the game's rules. Engine mechanics, assets and Workshop experiments do not change.

## U06 acceptance map

The card slice is integrated as `16be4639`; 61 focused tests, typecheck and artwork checks pass. The existing piece and power sources already own IDs, names, available powers and contextual help (`LETTERS`/`NAMES`, `KINGS`, `POWER_NAME`, `powerOptions`, and `GameRules`). Do not add a second catalog to duplicate those facts. The 55-row shared-mechanics matrix links the released roster to behavior examples.

Existing presentation helpers receive the stored game's explicit owned rules/context; 27 guide checks preserve context. The board binds `GameRules(view.rules)` and passes the relevant context to `readText`. Learning routes and Workshop retain the U04 full-suite and lesson-return evidence. Current compiled `painted-game` and `web-online` checks pass Review, Today, local input, offline practice and offline lesson/Workshop preservation. The local lesson path restores the original game after a lesson. No account service is added to local play.

The account boundary rejects forged local design and lab-only pool input before game creation or tool-try work. The focused HTTP run passes 56 tests, typecheck and 54 artwork checks; issue 02 records the receipt. No product correction is required for admission.

These reused paths and the small card change satisfy U06. Staging `d92991cb` passes all 112 compiled mechanics executions and the integrated actual web–ChatGPT checks. The accepted U08 presentation cut resolves the fingerprint dependency on display helpers; wording controls preserve enforcement bytes. Independent read review confirms closure by these existing results. No new test run, catalog or wrapper is added for closure. The parent shared-mechanics verification report holds the exact source, artifact receipts and limits.
