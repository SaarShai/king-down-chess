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

## Progress

2026-11-08:

- Owner step 1: the owner signed in to Xcode with the team's Apple ID. Owner step 2: the owner accepted the updated Program License Agreement; before that, the App Store export failed with "PLA Update available". The agent made the app record: King Down, Apple ID `6832224765`, bundle ID `dev.kingdown.app` (registered by the export as "XC dev kingdown app"), SKU `kingdown-ios`, primary language English (U.K.), the game's spelling, and Full Access.
- Agent steps 1 and 2: `npm run ios:sync production`, then a Release archive. The export made the distribution certificate and the profile "iOS Team Store Provisioning Profile: dev.kingdown.app". The commands and the build number rule are in `docs/IOS.md`.
- A readiness check of the archive (bundle, third-party SDKs, web payload) found nothing that stops the upload. It found the iOS floor fault: the game code needs iOS 16.4, and the app said 15.0. The archive for the upload has `MinimumOSVersion` 16.4.
- Open: the upload of build 1.0 (1), then owner step 3 (internal testing group) and the install on the owner's iPhone.

## Done when

The build installs on the owner's iPhone through TestFlight and plays a game against the computer.
