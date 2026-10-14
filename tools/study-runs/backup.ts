import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BackupInput, BackupProof } from './transport-types';
import { execute } from './transports';
export async function backupRun(input:BackupInput):Promise<BackupProof> {
  if(!/^[a-z0-9][a-z0-9-]{0,100}$/.test(input.runId))throw new Error('Invalid internal run ID');
  const output=await execute('python3',[join(dirname(fileURLToPath(import.meta.url)),'backup-proof.py')],{input:JSON.stringify(input),timeout:7350000,maxBytes:1024*1024});
  const proof=JSON.parse(output);
  if(proof.verified!==true||!Number.isInteger(proof.files)||proof.files<1||!Number.isSafeInteger(proof.bytes)||proof.bytes<0||typeof proof.receiptPath!=='string')throw new Error('Invalid backup proof');
  return proof;
}
