// Limits and counter advice from the approved teaching content, corrected for the launch rules.
import type { ReleasedCardId } from '../../content/cards';
import type { PowerName } from '../../rules/rules';

type Note = readonly [string, string];
// Each king power and released card needs a note (type check). Each released piece needs one by its name (tools/forms-drift.test.ts).
export const learningNotes: Record<string, Note> = {
  "Pawn": [
    "The path must be empty. Choose a type from the promotion choices on the last rank. No en passant in this game.",
    "Block its forward path. Attack it from the side."
  ],
  "Knight": [
    "Do not land on your own piece. It cannot capture a Guard.",
    "Attack its landing squares."
  ],
  "Bishop": [
    "Pieces block the path. It cannot capture a Guard.",
    "Put a piece in its path. It stays on one square colour."
  ],
  "Rook": [
    "Pieces block the path. It cannot capture a Guard.",
    "Block its rank or file."
  ],
  "Queen": [
    "Pieces block the path. It cannot capture a Guard.",
    "Block its path or attack it with a protected piece."
  ],
  "King": [
    "Never end in check. Kings cannot stand next to each other. There is no castling in this game.",
    "Give check. Remove every safe reply to give checkmate."
  ],
  "Archer": [
    "The shot passes over pieces. It cannot shoot an adjacent piece or a Guard. Its shot can give check.",
    "Move next to it, or use a backward diagonal outside its shot pattern."
  ],
  "Beast": [
    "Each later step must capture. A later capture cannot capture a king. Select End turn at a legal stop. Undo removes one capture.",
    "Keep your pieces more than one square apart. A Guard stops captures."
  ],
  "Guard": [
    "It blocks paths. An Ogre can push it. It cannot capture.",
    "Use your king to capture it, or use an Ogre to push it."
  ],
  "Maester": [
    "The swap captures nothing. Your king must end on a safe square. A normal capture cannot capture a Guard.",
    "Attack the king’s possible landing square to prevent its swap."
  ],
  "Ogre": [
    "Never push a king. The destination must be empty and on the board. An edge does not remove a piece. You can push a Guard, but cannot capture it.",
    "Block the square behind a piece, or put it at the edge."
  ],
  "Paladin": [
    "Enemies block the path. It cannot capture a king or Guard and never gives check. After it captures anything except a pawn, remove the Paladin too.",
    "An enemy piece blocks its path. A non-pawn capture also removes it."
  ],
  "Freeze": [
    "The frozen piece still attacks. It can still be captured. The effect ends after the opponent’s next turn. If the piece moves, the mark moves with it. The mark ends when the piece leaves the board.",
    "Use another piece, or capture the piece that gives check."
  ],
  "IceWall": [
    "The piece can move. A push can still move it. The effect ends after the opponent’s next turn. If the piece moves, the mark moves with it. The mark ends when the piece leaves the board.",
    "Attack another piece, or push the protected piece."
  ],
  "Strike": [
    "Do not jump over pieces. Do not capture.",
    "Block its path or attack its possible landing squares."
  ],
  "Haste": [
    "Neither move captures. You can End turn after the first legal move. Undo removes one move at a time.",
    "Block its routes. It cannot remove a blocker by capture."
  ],
  "Flight": [
    "Pawns are allowed, but cannot land on your back rank. It captures nothing.",
    "Cover landing squares in the opponent’s half."
  ],
  "Sacrifice": [
    "You cannot return a pawn, Guard or king. Use the piece type at capture. A Paladin that left the board after its capture can return.",
    "Capture valuable pieces only when their return is safe for you."
  ],
  "March": [
    "Pawns still capture on a forward diagonal. A March move from another rank gives no en passant. The card moves only a pawn that is not on its start rank. A pawn that reaches the last rank promotes.",
    "Block the file."
  ],
  "Leap": [
    "Other pieces still block. Do not capture a king or Guard.",
    "Block the line with a non-pawn or an enemy piece."
  ],
  "HolyLight": [
    "The shelter covers four adjacent squares, not diagonals. The king must still avoid other attacks. The king can capture pawns.",
    "Use a piece other than a pawn to attack the king. Move a protected piece away from its king."
  ],
  "Mercy": [
    "The king must end safely. Enemies block its path. Its shelter covers all eight adjacent squares.",
    "Use a pawn to capture a sheltered piece. Attack the king’s landing square."
  ],
  "DeathTouch": [
    "The two-square reach never goes sideways or diagonally. The reach can give check. A king is never a power target.",
    "Block the two-square reach or stay outside it."
  ],
  "Darkness": [
    "The king’s middle and final squares must be empty. The final square must be safe; the middle square can be attacked. This step cannot capture or give an extra attack.",
    "Keep your pieces off the square directly ahead of an enemy pawn. Watch the king’s two-square escape."
  ],
  "Salvation": [
    "Do not return a pawn, Guard or king. Use its type at capture. A Paladin that left the board after its capture can return.",
    "Occupy or attack the possible return squares."
  ],
  "MirrorB": [
    "Copy only a card that you did not play. Do not copy Mirror. The copied card sets the targets, limits and turn cost.",
    "Read the copied card’s rule."
  ],
  "Firewall": [
    "The effect prevents captures and Curse. A push can still move a piece. The effect ends after the next enemy turn.",
    "Use a move without a capture or push a piece."
  ],
  "EarthQuake": [
    "A blocked piece stays. A piece stays when its push leaves the board. A frozen piece stays. The centre piece stays. A pawn cannot land on rank 1 or 8.",
    "Use occupied destination squares or the edge to prevent a push."
  ],
  "Burn": [
    "No king or Guard target. Other capture protection still applies.",
    "Block the path or leave the four centre squares."
  ],
  "FireStarter": [
    "No king or Guard target. Other capture protection still applies.",
    "Block the path to your back rank."
  ],
  "Control": [
    "Neither piece can be a pawn or king. Use a different adjacent type. A Guard still cannot capture. The moving piece keeps its type. Do not capture a king. The borrowed move cannot swap or push.",
    "Separate the two pieces, or block the borrowed path."
  ],
  "Rally": [
    "Neither move captures. End turn is available after the first move. The second piece cannot swap or push the first piece.",
    "Block routes; Rally cannot remove a blocker by capture."
  ],
  "MorphP": [
    "Choose the new type. It remains that type and captures nothing now. A frozen pawn cannot change.",
    "Attack the new piece on its current square."
  ],
  "Mimic": [
    "Neither type can be a pawn or king. It cannot capture.",
    "Block the borrowed path."
  ],
  "Vault": [
    "A second piece blocks the path. Do not capture a king or Guard.",
    "Put a second piece in the path."
  ],
  "Curse": [
    "Never move the king. A pawn stays off ranks 1 and 8. Protection and king safety can prevent the action.",
    "Use protection or occupy the neighbouring squares."
  ],
  "SkyLift": [
    "Neither piece can be a pawn or king. Your king must stay safe. A frozen piece cannot swap.",
    "Attack the possible final positions."
  ]
} satisfies Record<PowerName | ReleasedCardId, Note> & Record<string, Note>;
