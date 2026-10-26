# Spec and samples

Status: needs-info
Type: task

## Scope

Write the spec and build static samples. Change files only in this feature folder.
Do not build the server change. Do not run a migration, sign in, push or deploy.

## Plan

1. Check the current local, online and shared app paths.
2. Write the decisions, data rules, API changes and build tickets.
3. Render the samples with fake data and the current CSS on port 4322.
4. Check each requested size. Check text, image loads and overflow.
5. Commit the docs and sample code. Run `npm run test:docs` after the commit.
6. Stop the local server by PID. Write the output note and manifest.

## Acceptance checks

- Each owner decision and each proposed pick appears in the spec.
- Each build ticket has scope, acceptance checks and tests to add.
- Each sample has a 375×812 and a 1280×800 PNG.
- The picker also has a 320×568 PNG. Controls stay in reach by scroll.
- The spec includes race checks, old saves and old links.
- The commit changes no product code. The normal commit hook runs.

## Tests to add

No product test changes belong to this ticket. The sample capture checks local
requests, images, page errors, horizontal overflow and control bounds.
The build tickets list the product tests.

## Evidence

The source base is `de2a724b`. Work starts on `staging/friend-invites` with a clean tree.

The spec and eight build tickets are complete for owner review. All 13 sample screens render.
The capture produces 30 PNGs and passes its layout, asset and local-request checks.
A visual pass checks the phone, desktop and both small-picker views.
The design detector reports no findings. The owner has not approved the product build.
The output note records the commit result and the docs check after the commit.
