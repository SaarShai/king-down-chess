import type { PowerName } from '../../rules/engine';

const FILE: Record<PowerName, string> = {
  Freeze: 'freeze', IceWall: 'ice-wall', Strike: 'strike', Haste: 'haste', Flight: 'flight', Sacrifice: 'sacrifice',
  March: 'march', Leap: 'leap', HolyLight: 'holy-light', Mercy: 'mercy', DeathTouch: 'death-touch', Darkness: 'darkness',
};
/** The mark of a power: a full enamel disc with its own brass rim. */
export const powerMark = (power: PowerName) => `/ui/powers/${FILE[power]}.webp`;
