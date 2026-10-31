import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';

it('rejects a changed candidate before writing to the target', () => {
 const root=mkdtempSync(join(tmpdir(),'kingdown-walk-promotion-')),candidate=join(root,'candidate'),target=join(root,'target');
 try {
  mkdirSync(candidate);mkdirSync(target);writeFileSync(join(candidate,'manifest.json'),'{}');
  expect(()=>execFileSync('python3',[resolve('tools/anim/promote-painted-moves.py'),'--candidate',candidate,'--target',target],{stdio:'pipe'})).toThrow(/Candidate catalog does not match the selection/);
  expect(readdirSync(target)).toEqual([]);
 } finally {rmSync(root,{recursive:true,force:true});}
});
