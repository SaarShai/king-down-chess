# iOS App Store answers

Status: draft, 2026-11-08. Ticket: [Write the privacy manifest and the store answers](issues/11-privacy.md). The owner copies these answers into App Store Connect. Code facts cite `path:line` on `origin/main` (d49875e8a).

The app is the web game in a Capacitor shell. Apple counts the data that the bundled web code sends to `/api` and to Supabase as the app's own collection (https://developer.apple.com/app-store/user-privacy-and-data-use/). Make store and external TestFlight builds with `npm run ios:sync production`.

## 1. App Privacy

Where: App Store Connect > the app > App Privacy. An Account Holder, Admin or App Manager publishes the answers. Sources: https://developer.apple.com/app-store/app-privacy-details/ and https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy

1. "Do you or your third-party partners collect data from this app?": **Yes**.
2. Select the six data types in the table. For each type: **Linked to the user: Yes**, **Tracking: No**, **Purpose: App Functionality** only.

| Data type (category) | What the app sends, and why |
| --- | --- |
| Email Address (Contact Info) | The address for the sign-in code. Supabase Auth keeps it with the account. Resend sends the code mail. Other players never see it (`src/account/client.ts:72-77`). |
| User ID (Identifiers) | The account ID from Supabase Auth and the player's handle (`src/online/client.ts:41`, `supabase/migrations/0005_accounts_v2.sql:9-11`). |
| Gameplay Content (User Content) | Online games and moves, the five preset messages, the cloud save (settings, lessons, saved game), ratings and badges. Only for a signed-in player; signed-out play stays on the device (`supabase/migrations/0006_games.sql:10-89`, `src/account/client.ts:94-108`). |
| Other User Content (User Content) | The block list (`src/plugin/screens/board-actions.ts:57`). Reports (with an optional free-text note) and follows have server routes but no app screen yet (`src/online/safety.ts:20-22`, `src/online/client.ts:89`). |
| Product Interaction (Usage Data) | The time a player last opened or played each online game, and the counters that limit new games, computer turns and code tries (`src/match/service.ts:479`, `supabase/migrations/0014_plugin_tool_tries.sql:4-10`). |
| Other Diagnostic Data (Diagnostics) | Fault reports, which hold no account ID and no IP address (kept 30 days), and the server and sign-in logs, which hold the IP address and the user agent (Vercel 1 day; Supabase per its log period and the audit-log switch, open item 5) (`src/diagnostics/browser.ts:27-28`, `public/privacy.html:74-75`). The logs make this type linked. |

Do not select other types: the app has no ad, analytics or crash tool, no purchases, no location and no device ID (`package.json:45-55`). No tracking, so no App Tracking Transparency prompt.

Choices in this table:

- Presets are Gameplay Content, not Emails or Text Messages: the player picks one of five fixed phrases and types no text (`src/match/protocol.ts:23`).
- Page faults are Other Diagnostic Data, not Crash Data: the app has no native crash reporter.
- The block list is Other User Content. If a follow screen comes, check Contacts (Apple's definition names a social graph) for the follow list.
- Presence time is Product Interaction: Apple's list for that type names "saved place in a game" and other data on how the user uses the app.
- Other Diagnostic Data is linked because Supabase keeps the sign-in IP address with the account. If you take the logs off the label, the fault reports alone are not linked.

The manifest `ios/App/App/PrivacyInfo.xcprivacy` declares the same six types. After Product > Archive, select Generate Privacy Report in the Organizer and compare it with this table (https://developer.apple.com/documentation/bundleresources/describing-data-use-in-privacy-manifests).

## 2. URLs

Sources: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy (Privacy Policy URL, Privacy Choices URL), https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information (Support URL: required; it must lead to real contact information, which some storefronts need with an address and a telephone number).

| Field | Value | File |
| --- | --- | --- |
| Privacy Policy URL (required for iOS) | https://kingdown.dev/privacy.html | `public/privacy.html` |
| Privacy Choices URL (optional) | https://kingdown.dev/delete-data.html | `public/delete-data.html` |
| Support URL | https://kingdown.dev/support.html | `public/support.html` |

## 3. Age rating

Where: App Information > Age Rating. Sources: https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions, https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating, https://developer.apple.com/news/?id=yxkh08us

| Question | Answer | Why |
| --- | --- | --- |
| Parental Controls | No | |
| Age Assurance | No | |
| Unrestricted Web Access | No | The shell opens outside links in the system browser (`node_modules/@capacitor/ios/Capacitor/Capacitor/WebViewDelegationHandler.swift:108-120`). `capacitor.config.json` has no `allowNavigation`. |
| User-Generated Content | Yes | Player-chosen handles show to opponents and on leaderboards. The game filters them (`src/account/profile.ts:63-70`). |
| Social Media | No | No feed. |
| Messaging and Chat | Yes | Five fixed preset messages; no free text between players (`src/match/protocol.ts:23`). |
| Advertising | No | |
| Profanity or Crude Humor, Horror/Fear Themes, Alcohol, Tobacco, or Drug Use or References | None | |
| Medical or Treatment Information, Health or Wellness Topics | None | |
| Mature or Suggestive Themes, Sexual Content or Nudity, Graphic Sexual Content and Nudity | None | |
| Cartoon or Fantasy Violence | Frequent | Each capture shows a fantasy attack, and every game has many captures. Example: an archer's arrow knocks the victim down (`docs/painted-game/README.md:25`). |
| Realistic Violence, Prolonged Graphic or Sadistic Realistic Violence | None | |
| Guns or Other Weapons | Frequent | Captures show weapons, for example the archer's arrow. |
| Gambling, Simulated Gambling, Loot Boxes | None / No | No bets and no purchases. |
| Contests | Frequent | Rated online play with ratings and leaderboards is always open. |
| Shared Location (asked from 16 November 2026) | No | |
| Dating and Relationships (asked from 16 November 2026) | No | |
| Made for Kids | (not shown) | Apple offers it only at 4+ or 9+. |

Result: **13+** (iOS 26 and later). Each of the three Frequent answers gives 13+. The result is 9+ only if all three are Infrequent. After Save, check the global, regional and "Operating Systems Earlier than Version 26" ratings on the App Information page, and edit again if one is wrong. No override: the terms set no minimum age (`public/terms.html`).

## 4. Export compliance

Sources: https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption, https://developer.apple.com/help/app-store-connect/reference/app-information/export-compliance-documentation-for-encryption, https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations

- Answer: the app uses only encryption in the Apple operating system. Keep `ITSAppUsesNonExemptEncryption` = NO (`ios/App/App/Info.plist:25-26`). Builds then skip the export questions, and no documents go to Apple.
- Why: the app sends HTTPS through WebKit and uses WebKit's Web Crypto. No crypto library ships in the app (`jose` is server code only).
- The developer carries the liability for this claim (https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance).

## 5. Account deletion

Source: https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion/

- In the app: sign in, then Menu (gear button in the game bar, `index.html:76`) > Account (`index.html:189`) > Delete my account (`src/account/account.ts:54`) > Delete my account in the dialog (`index.html:203-211`).
- The dialog says that the deletion comes after seven days and that a sign-in before then keeps the account.
- On the web: https://kingdown.dev/delete-data.html.
- Text for the App Review notes: "To delete an account: sign in, tap Menu (gear icon), then Account, then Delete my account, and confirm. A daily job deletes the account and its data after a seven-day grace period. A sign-in during the grace period cancels the request."

## 6. Open items before submission

1. **Privacy link in the app (fixed).** The Account links use `target="_blank"` with a relative path (`src/account/account.ts:39-40`). The shell gives `capacitor://localhost/privacy.html` to `UIApplication.open` (`WebViewDelegationHandler.swift:334-339`), and the app registers no URL scheme, so the link does nothing. Guideline 5.1.1(i) needs the policy link in the app. Fixed with ticket 11: the links use the site of the build's stage (`apiOrigin`), and the shell opens them in the system browser (checked in the simulator).
2. **Report control (fixed; device test open).** Before the fix, no app screen sent a report: `POST /api/reports` and its transport (`src/online/runtime.ts:78`) existed, but no screen called them, and reports went by email through `support.html`. Guideline 1.2 requires a report mechanism for apps with user content (https://developer.apple.com/app-store/review/guidelines/#user-generated-content), and the handles make this app one. Fix: a report control on the opponent's handle or in the game menu that calls `POST /api/reports`; as a minimum, a working in-app link (absolute https URL or `mailto:`) to the report email. Test it with item 1. Fixed with ticket 13: the board Menu, the seat Menu and the end card have Report player. It sends a reason and an optional note to `kingdown_report`, which calls `POST /api/reports`; the `plugin-ui` browser check covers the board Menu path. A test on a device is still open. Ticket: [Add a report path in the app](issues/13-report-path.md).
3. **Deletion notice.** No notice reaches the player when the deletion is done; Apple asks for a confirmation. The dialog does not say that a report hold can delay the deletion. `delete-data.html` says "Sign in at kingdown.dev" and "Settings"; the app says "Menu".
4. **Policy text.** `public/privacy.html` speaks of "the website" (lines 34, 75). Add the iOS app and its email-code sign-in.
5. **Log fields.** In the Supabase dashboard, confirm that Authentication > Audit Logs > "Write audit logs to the database" is off, then run the one-time delete of the old rows (`docs/submission/checklist.md:40`, `docs/submission/privacy-additions.md:39`); else each sign-in stays in `auth.audit_log_entries` with the email and IP address, with no end, after deletion too. Check the session rows (the app signs out with local scope, `src/account/client.ts:29`, so they keep the IP address and user agent). Check in the Vercel and Supabase dashboards which fields the logs keep and the log period. If we use a location from the IP, add Coarse Location.
6. **First upload.** Watch for ITMS-91056 (invalid manifest) and ITMS-91053 (missing API reason). TN3181 lists an empty `NSPrivacyAccessedAPITypes` array as invalid (https://developer.apple.com/documentation/technotes/tn3181-debugging-invalid-privacy-manifest), and Capacitor 8.6.0 ships one in `Capacitor.framework/PrivacyInfo.xcprivacy` and `Cordova.framework/PrivacyInfo.xcprivacy`. The app's own manifest leaves out empty keys. The readiness check of the first archive (2026-11-08) expects the upload to pass with these files, and found no other manifest fault. The first upload (build 1.0 (1), 2026-11-08) is the test: read the App Store Connect email. If an email names one of the two files, move to a Capacitor release with a corrected file and archive again. Keep both files in the app. Apple's list of commonly used SDKs names Capacitor and Cordova, so a missing file is ITMS-91061 (https://developer.apple.com/support/third-party-SDK-requirements/). The vendor signature seals each file, so an edit breaks the seal.
7. **Owner's legal decisions.** The year-end self-classification report to BIS for exempt encryption, and age assurance laws (Texas SB 2420, Utah, Louisiana, Brazil).
8. **Later.** When Google, GitHub or Sign in with Apple come to the app, add Name to the label and the manifest, and revoke Apple tokens on deletion.
