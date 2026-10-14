import type { RunMachine } from '../../src/study/run-types';
/** Internal inputs only. The browser never provides commands, paths or remote names. */
export interface DispatchInput {
  runId: string; bundleHash: string; partId: string; machine: RunMachine; workers: number;
  directory: string; sourceArchive: string; bundlePath: string; nodeVersion: string;
  limitSeconds: number;
}
export interface RemoteReceipt { remoteId: string; acceptedAt: string }
export interface RemoteStatus {
  state: 'running' | 'complete' | 'failed' | 'unknown'; completedGames: number | null;
  message: string; remoteId: string;
}
export interface RunTransport {
  preflight(input: DispatchInput): Promise<void>;
  launch(input: DispatchInput): Promise<RemoteReceipt>;
  status(input: DispatchInput, receipt: RemoteReceipt | null): Promise<RemoteStatus>;
  collect(input: DispatchInput, receipt: RemoteReceipt | null, destination: string): Promise<void>;
}
export interface BackupInput { runId: string; directory: string; mainRoot: string }
export interface BackupProof { verified: true; receiptPath: string; files: number; bytes: number }
