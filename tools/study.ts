import { openSync, closeSync, fstatSync, readSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { parseStudy } from '../src/study/model';
import { openStudy } from '../src/study/session';
import { parseTest, checkStudy } from '../src/study/check';
import { exampleStudies } from '../src/study/examples';
import { studySource } from './lib/study-source';

export const MAX_STUDY_BYTES = 1024 * 1024;
export function readStudyFile(path: string): unknown {
  const fd = openSync(path, 'r');
  try {
    const info = fstatSync(fd);
    if (!info.isFile()) throw new Error('Input must be a regular file.');
    if (info.size > MAX_STUDY_BYTES) throw new Error('Study file exceeds 1 MiB.');
    // Bound the read too: the file can grow after the size check.
    const buffer = Buffer.alloc(MAX_STUDY_BYTES + 1);
    let used = 0;
    // readFileSync cannot bound a file that grows during the read.
    while (used < buffer.length) {
      const count = readSync(fd, buffer, used, buffer.length - used, null);
      if (!count) break;
      used += count;
    }
    if (used > MAX_STUDY_BYTES) throw new Error('Study file exceeds 1 MiB.');
    return JSON.parse(buffer.subarray(0, used).toString('utf8'));
  } finally { closeSync(fd); }
}
export function saveStudyFile(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
}
export function runStudy(args: string[]): number {
  try {
    const { positionals, values } = parseArgs({ args, allowPositionals: true, options: { out: { type: 'string' } } });
    const [command, file, lan] = positionals;
    const sizes: Record<string, number> = { examples: 1, inspect: 2, play: 3, undo: 2, check: 2, extract: 2 };
    if (!(command in sizes) || positionals.length !== sizes[command]) throw new Error('Use examples --out DIR, inspect FILE, play FILE LAN --out NEWFILE, undo FILE --out NEWFILE, check FILE, or extract FILE --out NEWFILE.');
    const writes = ['examples', 'play', 'undo', 'extract'].includes(command);
    if (writes !== (values.out !== undefined)) throw new Error(writes ? 'Supply --out.' : 'This command does not accept --out.');
    const engine = studySource();
    if (command === 'examples') {
      mkdirSync(values.out!, { recursive: false });
      for (const test of exampleStudies(engine)) saveStudyFile(resolve(values.out!, `${test.study.id}.json`), test);
      console.log(JSON.stringify({ out: values.out, status: 'saved' }));
      return 0;
    }
    const input = readStudyFile(file);
    if (command === 'check') {
      const report = checkStudy(input, engine);
      console.log(JSON.stringify(report, null, 2));
      return report.status === 'passed' ? 0 : 1;
    }
    const wrapper = typeof input === 'object' && input !== null && 'schema' in input && input.schema === 'kingdown-test/1';
    const study = wrapper ? parseTest(input).study : parseStudy(input);
    if (command === 'extract') {
      openStudy(study, engine);
      saveStudyFile(values.out!, study);
      console.log(JSON.stringify({ out: values.out, status: 'saved' }));
      return 0;
    }
    if (writes && wrapper) throw new Error('A test contains indexed checks. Edit a separate plain study file to keep those checks safe.');
    const session = openStudy(study, engine);
    if (command === 'inspect') console.log(JSON.stringify({ study, ...session.snapshot() }, null, 2));
    else {
      if (command === 'play') session.play(lan);
      else if (!session.undo()) throw new Error('No recorded action to undo.');
      const saved = session.exportStudy();
      saveStudyFile(values.out!, parseStudy({ ...saved, version: study.version + 1, parentVersion: study.version }));
      console.log(JSON.stringify({ out: values.out, status: 'saved' }));
    }
    return 0;
  } catch (error) {
    console.error(`Study error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = runStudy(process.argv.slice(2));
