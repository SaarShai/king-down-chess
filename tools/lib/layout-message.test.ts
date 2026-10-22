// Unit test of the layout assert message (ticket 25 a): it gives both boxes with all five measurements.
import { describe, expect, it } from 'vitest';
import { layoutMessage } from './layout-message.mjs';

describe('layoutMessage', () => {
  it('names the element box and the frame box', () => {
    const msg = layoutMessage('end', 390, { left: 0, right: 391.25, top: 10, bottom: 700, width: 391.25 }, { left: 0, right: 390, top: 0, bottom: 844, width: 390 }, 'scroll overflow true');
    expect(msg).toBe('end fits at 390px: element {left 0, right 391.3, top 10, bottom 700, width 391.3}; frame {left 0, right 390, top 0, bottom 844, width 390}; scroll overflow true');
  });
  it('starts with the element name and viewport width', () => {
    expect(layoutMessage('x #over', 360, { left: 1, right: 2, top: 3, bottom: 4, width: 1 }, { left: 0, right: 360, top: 0, bottom: 800, width: 360 })).toMatch(/^x #over fits at 360px: element \{/);
  });
});
