# Worked designer studies

These examples connect a design question to tests and a decision. The first is
an unrun acceptance example for the proposed workflow. The second uses saved
campaign evidence. Neither starts a run or adopts a rule.

## A supported custom piece through the whole system

**Question:** Does a private copy of the Rook retain its meaning from the
Proving Ground through a full game and its replay?

Copy the current Rook preset as “My Rook”. Make no rule change. Pin the source,
the saved design code and the full ruleset. This is a positive control for the
framework, not a claim about a new piece's balance. Use the current one-design
slot. Refuse a second distinct design in that game.

Use this constructed board, with White to act: White king a1, Black king h8,
My Rook d4, White pawn d5, Black pawn f4. There are no other pieces, cards,
powers or marks. Set all other fields explicitly from the chosen baseline.

Expected assertions:

- d4–e4 is a quiet move. d4×f4 is a capture.
- d4–g4 is blocked by the enemy on f4.
- d4–d5 and d4–d6 are blocked by the friendly pawn on d5.
- d4–e5 is outside the pattern.
- Replacing My Rook with the base Rook gives the same legal moves and attacks.
- After d4×f4, the design stands on f4 and the pawn is in the correct captured
  state. Undo returns the exact prior state. Save/reload and legal replay agree.

The fixture is deliberately small. A second fixture puts the piece on a pin
line, and a third uses a checked king. Those distinguish a painted movement
pattern from a legal action. Test both colors with the verified transform.

Next, introduce one supported edit selected by the designer. Save a new version
and its short intent statement. Add a positive, refusal and boundary fixture
for that edit. Select interaction cases from the state it changes. Do not carry
the unchanged-copy control's pass over as evidence for the edit.

For balance, define the reference replacement, calibrate worth, then measure
activity and game health in the intended pool. Keep the estimated search price
separate from measured worth. Test the candidate with both sides and competent
policies. For experience, let players predict its action and solve one scenario,
then try the same task with the base piece. Record the choices and confusion.

**Decision packet:** engine parity and replay can pass on fixtures; balance,
strategy and human experience remain missing until their studies run. The item
can be ready for a playtest without being approved for the pool. This is the
acceptance path for [ticket 02](issues/02-save-a-study.md).

## A real policy result without an invented card synergy

**Question:** Why does a policy that favors spending cards do worse when it holds
Mimic and SkyLift, and does the pair create a useful player choice?

The saved fresh study contains 4,480 games. With both cards present, the spend
policy scores 10.08 percentage points below standard. The family interval is
−17.53 to −2.63 points. No registered card-pair interaction clears its family
interval. This is evidence about the tested policies, opponents and starts. It
does not show that the cards are weak, that the pair has no interaction, or why
the spend policy loses. See the [source review](source-review.md).

The report scores caps as draws. The two compared cells contain 18 standard
caps and 19 spend caps, with 640 games in each cell. Alternative outcomes can
shift the point contrast by up to 2.89 points. The interval above is conditional
on that convention until a paired cap-sensitivity check establishes robustness.

The follow-up starts with the saved data, before another campaign:

1. Freeze the report, source, four-cell specs and matched block IDs. Validate a
   direct legal replay of each selected line under that source. Do not replay
   historical games under today's defaults. Check cap sensitivity before making
   a stronger policy claim.
2. Select matched cases where standard wins and spend loses. Also retain reverse
   and neutral cases. Keep all selected denominators. This sample explains
   possible mechanisms; it does not estimate their prevalence.
3. Find the first meaningful difference. Record the card's instance, available
   alternatives, material, threatened targets and later card opportunities.
   Count actual use. The spend preset changes incentives; it does not force use.
4. Save the state before that decision as a scenario. Branch from spend, hold,
   and an earlier opponent defense. Allow the opponent to reply to each branch.
   Keep horizon and search budget equal. Label unfinished branches as unfinished.
5. State a testable mechanism only after the trace supports it. For example,
   “early use removes a later reply” is a hypothesis until the relevant alternate
   line works. Search for cases where the same early use is good.
6. Give players the scenario without the proposed solution. Ask them to choose,
   then show both lines. Record understanding, perceived options, surprise,
   frustration and replay preference. A designer judges whether the tradeoff is
   worth keeping.

If a mechanism survives this check, predeclare a fresh study. Use all four cells
(neither, Mimic, SkyLift, both) and both policies. The primary question determines
whether to test card interaction, policy difference within the pair, or the
difference between policy effects across cells. These are different contrasts.
Set the family and practical margin before choosing new starts.

**Current decision:** keep the rules and standard policy. Preserve the observed
policy result. Investigate the mechanism before changing a card or launching a
broader search. A successful explanation can become a “spend or save” challenge;
its difficulty and enjoyment still need human evidence.

## Apply the same route to other design types

| Design question | First scenario | Study and decision evidence |
|---|---|---|
| Does Flight give Beast a useful setup plan? | A legal position before relocation, with at least two opponent replies | The fresh 3,840-game study does not repeat the draw lead. Inspect routes and counterplay; do not infer a balance fault from that lead |
| Does a mark last for the intended time with an extra action? | Before the mark, after each sub-action, and at both turn boundaries | Assert the current rule's exact expiry; then measure opportunity and actual effect. Low use alone cannot decide strength |
| Does a spawn create a good promotion threat? | Empty and occupied spawn targets, check-blocking cases, and a legal path to promotion | Preserve the new entity through promotion and capture. Separate material gained from the choice it gives the opponent |
| Does a Guard rule create a lock? | One narrow passage, then a legal escape before the block forms | Check mobility and forced replies. Compare exact replacement arms. Equal win rates can coexist with a bad lock for both sides |
| Does a new setup or turn rule improve play? | First turn, repeated actions, repetition and terminal cases | Compare the whole ruleset with fixed starts where possible; use real turn state and decision counts; add human clarity tests |

These are test recipes, not new rule definitions or evidence that a proposed
behavior exists. For a new effect, first complete the meaning and support fields
in the template. Keep unsupported combinations visible until the engine can
execute and replay them.
