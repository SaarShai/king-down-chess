/** The local studio owns run records. Study documents keep their existing format. */
export type RunTarget = 'm1' | 'kaggle' | 'both';
export type RunMachine = Exclude<RunTarget, 'both'>;
export type RunPhase = 'preparing' | 'prepared' | 'launching' | 'running' | 'collecting' | 'validating' | 'complete' | 'partial' | 'failed' | 'launch-unknown' | 'attention-required';
export interface RunPartStatus {
  id: string; machine: RunMachine; workers: number; games: number; blocks: number;
  state: 'pending' | 'attempted' | 'running' | 'complete' | 'failed' | 'unknown';
  completedGames: number | null; checkedAt: string | null; nextCheckAt: string | null;
  deadline: string | null; error: string | null;
}
export interface StudyRunSummary {
  id: string; studioId: string; createdAt: string;
  study: { id: string; title: string; version: number; engine: string };
  planFingerprint: string; bundleHash: string; source: string; commit: string;
  recipe: string; games: number; blocks: number; target: RunTarget;
  approvalText: string; approvedAt: string | null; phase: RunPhase; parts: RunPartStatus[];
  validation: { state: 'pending' | 'passed' | 'failed' | 'incomplete'; games: number; legalReplays: number; illegalControls: number; message: string };
  backup: { state: 'pending' | 'running' | 'verified' | 'failed'; message: string };
  result: { bytes: number; sha256: string; filename: string } | null;
  error: string | null;
  canContinueDataset?: boolean;
}
export interface StudioSession {
  studioId: string; token: string; transportVerification: 'unverified';
}
