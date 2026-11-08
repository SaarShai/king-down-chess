# Make the first internal TestFlight build

Type: task
Status: open
Blocked by: 05
Parent: [iOS app map](../map.md)
Labels: wayfinder:task

## Question

What does the owner do once, and what does the agent run, to put a build on the owner's iPhone through TestFlight?

## Owner steps (once, in the web portals or Xcode)

1. Sign in to Xcode with the Apple ID of team `6M9C2YSWT4` (Xcode > Settings > Accounts), or make an App Store Connect API key (Users and Access > Integrations, role App Manager) and put the `.p8` file in `~/.appstoreconnect/private_keys/`. Tell the agent the key ID and issuer ID; never paste the key.
2. In App Store Connect, accept the current agreements and make the app record: name King Down, bundle ID `dev.kingdown.app`, SKU `kingdown-ios`, primary language English.
3. Add yourself to an internal testing group.

## Agent steps

1. `npm run ios:sync production` (or staging for a test of staging).
2. `xcodebuild archive` with automatic signing and `-allowProvisioningUpdates`, then `-exportArchive` with method `app-store-connect` and destination `upload`.
3. Record the build number rule (one more than the last upload) and the commands in `docs/IOS.md`.

## Done when

The build installs on the owner's iPhone through TestFlight and plays a game against the computer.
