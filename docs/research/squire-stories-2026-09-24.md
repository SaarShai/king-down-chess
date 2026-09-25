# Squire / medium-drop stories (2026-09-24)

> Recovery status, 2026-09-24: Lab-only historical reserve experiment. The implementation and raw games are archived; its movement/attack, hash, material and evaluation limitations prevent adoption or a balance verdict. [Catalog and qualifications](../cursor-recovery/2026-09-24-0213b442/RESEARCH.md) · [Adoption record](../cursor-recovery/2026-09-24-0213b442/EXECUTED.md).

Exploration only. Examples a person can follow in a short game. Not a reason to ship either rule.

## Setup

Eight arms, 12 games each, depth 2, 4 workers, seed 96. Specs under `sim/specs/stories-*.json`. One mirrored back rank per arm. Rules live in the JSON (`loadSpec` merges `--rule` over the file; these runs needed no CLI rule flags).

| arm | back rank | rule |
|---|---|---|
| `stories-COAQNRBK-step` | COAQNRBK | `squire=step` |
| `stories-COAQNRBK-medium` | COAQNRBK | `mediumDrop=true` |
| `stories-CGAQNRBK-step` | CGAQNRBK | `squire=step` |
| `stories-CGAQNRBK-medium` | CGAQNRBK | `mediumDrop=true` |
| `stories-CSAQNRBK-step` | CSAQNRBK | `squire=step` |
| `stories-CSAQNRBK-medium` | CSAQNRBK | `mediumDrop=true` |
| `stories-QOGNRKBA-step` | QOGNRKBA | `squire=step` |
| `stories-QOGNRKBA-medium` | QOGNRKBA | `mediumDrop=true` |

Outputs: `sim/out/stories-*.jsonl`. Defaults and `POOL` untouched. A drop prints as `E@…` for a Squire, or `N`/`B`/`M`/`O@…` for a medium choice; after that a Squire moves under the knight letter (`N…`).

## Moments

### 1. Squire drops, then captures (`CSAQNRBK`, step)

`stories-CSAQNRBK-step` game 7, early plies:

`E@d4` `E@h4` `g4xh5` `Nh4xh5`

Black drops a Squire on h4; White takes on h5 with a pawn; the Squire takes it back (`Nh4xh5` is that same dropped piece).

### 2. Dropped ogre that then shoves (`QOGNRKBA`, medium)

`stories-QOGNRKBA-medium` game 8:

`O@b4` … `Ob4xc4` … `Oc4>b5-a6`

Black drops an ogre on b4, captures on c4, then shoves the piece on b5 out to a6.

### 3. Archer shoots the drop (`CGAQNRBK`, step)

`stories-CGAQNRBK-step` game 8:

`E@c6` … `E@c3` `Nc6xc7` `Ne8xc7` `Ac1*c3`

White’s second drop sits on c3; Black’s archer, still on c1, rifles it (`Ac1*c3`).

### 4. Archer shoots a medium knight (`CGAQNRBK`, medium)

`stories-CGAQNRBK-medium` game 8:

`N@d4` `Ac1-d2` … `Ad2*d4`

Black drops a knight on d4; White steps the archer to d2 and shoots the drop.

### 5. Beast chain (`CSAQNRBK`, medium)

`stories-CSAQNRBK-medium` game 5, ply 42:

`Sd4-e5` `c6xd5` `Se5xd5xe6xe7xd8xd7xd6`

After the pawn takes on d5, the beast chains six captures in one move.

### 6. Catapult lob over a drop fight (`CGAQNRBK`, medium)

`stories-CGAQNRBK-medium` game 3:

`M@a6` `O@g3` `h2xg3` `c7-c5` `Ma6xa7` `Ca8*a2`

White’s dropped maester takes on a7; Black’s catapult lobs from a8 onto a2 (`Ca8*a2`).

### 7. Drop next to a king

**Did not occur.** Across all 192 drops, none landed on a square touching either king (Chebyshev distance 1). Closest were distance 2 — e.g. `E@g6` with Black’s king still on h8 (`stories-CGAQNRBK-step` game 2), or `B@e3` with White’s king on f1 (`stories-QOGNRKBA-medium` game 9).

### 8. Back-rank drop

**Did not occur.** No drop landed on rank 1 or 8 (`squireHome` stays off; the engines preferred the middle). Nearest: `E@a7` once (`stories-CGAQNRBK-step` game 4).

## Also seen (not counted above)

- Drop eaten on the spot: `E@g6` `f7xg6` (`stories-CGAQNRBK-step` game 2).
- Another catapult with a Squire on the board: `E@d6` … `E@d4` … `Ca8*a1` (`stories-COAQNRBK-step` game 4).

## What this is not

These are readable clips from depth-2 play on four fixed rows. They do not measure fairness, draw rate, or whether either drop belongs in the live game.
