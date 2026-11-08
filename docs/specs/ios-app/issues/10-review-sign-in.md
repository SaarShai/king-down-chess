# Choose the App Review sign-in path

Type: grilling
Status: open
Blocked by: 03
Parent: [iOS app map](../map.md)
Labels: wayfinder:grilling

## Question

App Review needs a demo sign-in that works without the reviewer's inbox. Production refuses password sign-in. Which path do we use?

## Options

1. A production password path for one allow-listed review account (the allow list exists in `plugin-deploy/review-signup-hook.sql`).
2. A review mailbox the reviewer can read.
3. Submit the first version with account play hidden in the app, and add it in a later version.

Recommended: 1. It is the smallest change that lets the reviewer test online play, and the allow list already guards it.
