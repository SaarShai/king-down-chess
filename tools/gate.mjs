// Repo gate: STUB. It exits 0 for each call. The secrets spec replaces this file with the real rules.
//
// Interface (fixed by checks-and-hooks/02; the git hooks call the gate through npm):
//   npm run gate -- staged
//     From pre-commit. The gate checks the staged change: the index that GIT_INDEX_FILE names.
//     stdin is empty.
//   npm run gate -- push <remote> <url>
//     From pre-push. stdin holds git's pre-push lines:
//     <local ref> <local object name> <remote ref> <remote object name>
//   Environment: the GIT_ variables that git sets for the hook stay. The current folder is the
//   top folder of the work tree.
//   Exit codes: 0 passes. Any other exit refuses the commit or the push. A missing `gate` script
//   in package.json also refuses. The hook shows the gate's stderr, so write each reason there.
process.exit(0);
