# Local review display repairs

The owner requests repairs for audit findings F8 and F9 on this branch.

- [F8: Same-turn scores](issues/01-score-direction.md): Keep score direction
  and search depth correct after a free action.
- [F9: Turn labels](issues/02-turn-labels.md): Use recorded turns in review
  headings, Key moments, and Copy moves.

Keep game rules and stored move tokens unchanged. Add a failing test before
each repair. Run focused tests in series. Commit each finding on its own.
