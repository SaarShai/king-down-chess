# Make the first internal TestFlight build

Type: task
Status: claimed
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

- The owner asked the agent to bring him to each sign-in ("signing in - open side panes and get me to where you need me to sign in") after the agent named the steps that follow them: the app record, the upload and the testing group.
- Owner step 1: the owner signed in to Xcode with the team's Apple ID. Owner step 2: the owner accepted the updated Program License Agreement; before that, a local App Store export (destination `export`) failed with "PLA Update available". The agent made the app record: King Down, Apple ID `6832224765`, bundle ID `dev.kingdown.app` (registered by the export as "XC dev kingdown app"), SKU `kingdown-ios`, primary language English (U.K.), the game's spelling, and Full Access.
- Agent steps 1 and 2: `npm run ios:sync production`, then a Release archive. After the agreement, the local export made the distribution certificate and the profile "iOS Team Store Provisioning Profile: dev.kingdown.app". Then the export with `ios/ExportOptions.plist` (destination `upload`) sent build 1.0 (1) to App Store Connect in 6 minutes, after release 18 was live (the upload shares the link with the release checks). The commands and the build number rule are in `docs/IOS.md`.
- A readiness check of the archive (bundle, third-party SDKs, web payload) found nothing that stops the upload. It found the iOS floor fault: the game code needs iOS 16.4, and the app said 15.0. The archive for the upload has `MinimumOSVersion` 16.4.
- Owner step 3: the agent made the internal group "Owner" with automatic distribution and added the owner (the only App Store Connect user) as its tester.
- App Store Connect processed build 1.0 (1) 5 minutes after the upload, with no ITMS email. TestFlight sent the invitation to the owner. The invitation email has no code; its "View in TestFlight" page shows the redeem code.
- The owner installed the build on an iPhone through TestFlight.
- Open: a game against the computer on the iPhone.

## Done when

The build installs on the owner's iPhone through TestFlight and plays a game against the computer.
