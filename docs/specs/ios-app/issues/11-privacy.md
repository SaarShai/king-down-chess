# Write the privacy manifest and the store answers

Type: task
Status: open
Blocked by: 03, 05
Parent: [iOS app map](../map.md)
Labels: wayfinder:task

## Question

What does the app declare in `PrivacyInfo.xcprivacy`, the App Privacy label, the age-rating questions and the export-compliance answer?

## Context

[Store and WKWebView rules](../../../research/ios-app-2026-11-07/store-and-webview-rules.md) and [accounts and online](../../../research/ios-app-2026-11-07/accounts-and-online.md): email address, user ID, gameplay content and unlinked diagnostics; no tracking, ads or purchases; account deletion exists (Settings > Account, 7-day grace). Draft the answers and the manifest; the owner enters them in App Store Connect.

## Result

Drafted on 2026-11-08 from a code inventory and Apple's pages. Nothing is entered in App Store Connect yet.

**Drafted**

- `ios/App/App/PrivacyInfo.xcprivacy`: `NSPrivacyTracking` false and six collected types: Email Address, User ID, Gameplay Content, Other User Content, Product Interaction and Other Diagnostic Data. Each type is linked, not tracking, purpose App Functionality. `plutil -lint` passes.
- The manifest has no `NSPrivacyTrackingDomains` key and no `NSPrivacyAccessedAPITypes` key. TN3181 says: with `NSPrivacyTracking` false, remove `NSPrivacyTrackingDomains`; if `NSPrivacyAccessedAPITypes` is empty, remove it (https://developer.apple.com/documentation/technotes/tn3181-debugging-invalid-privacy-manifest). The app's Swift files use no required-reason API. Capacitor 8.6.0 ships its own manifests for its frameworks.
- [store-answers.md](../store-answers.md): the App Privacy answers, the URLs, the age rating (13+), the export answer (NO) and the account-deletion path with a review note.

**Choices**

- Presets are Gameplay Content, page faults are Other Diagnostic Data (not Crash Data), presence time is Product Interaction.
- Other Diagnostic Data is linked, because Supabase keeps the sign-in IP address with the account. The fault reports alone are not linked.
- Other User Content covers the block list. Reports and follows have server routes but no app screen yet.
- Age rating: Contests, Cartoon or Fantasy Violence and Guns or Other Weapons are Frequent, so the result is 13+. The result is 9+ only if all three are Infrequent.

**In the project**: `PrivacyInfo.xcprivacy` is in the app target's Copy Bundle Resources (`project.pbxproj`), and the simulator build bundles it as `App.app/PrivacyInfo.xcprivacy`. After the first Archive, check that the Organizer privacy report shows the six types.

**Owner steps**

1. Enter sections 1 to 5 of `store-answers.md` in App Store Connect.
2. Keep the three Frequent answers (13+), or change them after a look at the capture art.
3. Decide two legal points: the year-end self-classification report to BIS, and the age assurance laws.

**Open before submission** (details in `store-answers.md`, section 6)

- Fixed in this change: the Account Privacy and Terms links did nothing in the app (`target="_blank"` to `capacitor://localhost`); they now use the site of the build's stage. Guideline 5.1.1(i) needs the policy link in the app.
- Submission blocker: no app screen sends a report; reports go by email. Guideline 1.2 requires a report mechanism: [Add a report path in the app](13-report-path.md).
- No notice reaches the player when the deletion is done. The dialog does not name the report hold. `delete-data.html` says "Settings" and "kingdown.dev", but the app says "Menu".
- The privacy policy speaks of the website only.
- Check the log fields and periods in the Vercel and Supabase dashboards.
- Watch for ITMS-91056 and ITMS-91053 after the first upload.
- Store builds use `npm run ios:sync production`; staging builds show password sign-in.
