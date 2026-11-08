# Web storage in the King Down iOS app: can iOS or WebKit delete it? (2026-11-08)

Question: the iOS app is Capacitor 8.6 with WKWebView, the default persistent data store, and pages from `capacitor://localhost`. Can iOS or WebKit delete the app's `localStorage` (and IndexedDB or Cache Storage) while the app stays installed? If yes, when? What is the documented fix?

Short answer: yes, in a small number of cases. WebKit has three deletion paths for this app: Intelligent Tracking Prevention (ITP), quota eviction and storage-pressure eviction. In the source, none of them is likely to hit an app that the player opens and taps. The bigger practical gaps are a backup restore in the first 24 hours after the first save, and the uninstall of the app (which deletes every store, native ones too). Recommendation (section 6): keep web storage for the first TestFlight builds. With the redesign, mirror the save keys to native storage and keep the session token in the Keychain.

Scope: WebKit blog posts, Apple developer documentation and Apple Support, Capacitor documentation and plugin source, and WebKit source on GitHub. All pages were read on 2026-11-08. Code facts cite `path:line` in this worktree (branch `ios-app`, `8bc0f5057`).

Labels: **Fact** is what a source says. **Inference** is this report's reading of a source; check it before you rely on it. WebKit source is the `main` branch at commit `b2d2c2de1c74` (2026-11-08). The WebKit build on a player's iPhone is older than `main`, so every source fact is an **Inference** about the shipped iOS until a device test confirms it.

Earlier work: `docs/research/ios-app-2026-11-07/store-and-webview-rules.md` (section "localStorage and IndexedDB: persistence and eviction") gave the first view. This report goes into the WebKit source and changes one point: ITP does apply to this app, but its window counts the days that the app runs, not calendar days.

## 1. What the app keeps in web storage

The grep covered `src/` for `localStorage`, `sessionStorage`, `indexedDB` and `caches` (test files excluded). The app uses no IndexedDB. The app uses the Cache API only for the online cache check, which is a web cache with no player data.

### localStorage (persistent: the subject of this report)

| Key | What it holds | Where | What the player loses if it goes |
| --- | --- | --- | --- |
| `kingdown.save` | The game in progress (FEN, moves, sides, staged plies, game time) and the settings (skill, coordinates, sound, queen, pace, threats, labels) | `src/screen/save.ts:28`, `:45-86`; fields at `:12-20` | The game in progress and all settings. A signed-in player gets the settings and the saved game back from the cloud after the next sign-in (`src/account/sync.ts:9`, `:32-37`). A player who never signed in loses them for good. |
| `kingdown.auth` | The Supabase session (access token, refresh token, user) | `src/account/session.ts:2`; `src/account/client.ts:23-26`; `src/account/account.ts:91`, `:127`, `:144` | The sign-in. The player must sign in again with an email code. No game data is lost by this key alone. |
| `kingdown.auth-code-verifier` | The PKCE verifier during a sign-in | `src/account/client.ts:32` (Supabase writes it under `storageKey`) | A sign-in that is in progress. The player starts it again. |
| `kingdown.sync` | The sync stamps: when each section last changed, and the cloud receipt | `src/account/sync.ts:30-32` | Nothing visible. On the next sync the cloud copy and the local copy compare again. |
| `kingdown.sync-owner` | The account that owns the local data, and a pending restore step | `src/account/local.ts:6`, `:38`, `:58` | Nothing visible, if the sync record is lost with it. The next sign-in imports the local data again. |
| `kingdown.local.<userId>` | A copy of the three local keys for each account that used this device | `src/account/local.ts:6`, `:96-115` | The local copy of another account's data. The cloud keeps the confirmed copy (`src/account/local.ts:40-46`). |
| `kingdown.lessons` | Lessons done (Learn is parked) | `src/lesson-store.ts:20-30`; `src/account/local.ts:5` | Lesson progress. It syncs to the cloud for a signed-in player (`src/account/sync.ts:9`). |
| `kingdown.new-game` | The choices in the New game dialog | `src/main.ts:99-104`; `src/ui/title.ts:17` | The last choices. The dialog shows the defaults. |
| `kingdown.first-deal` | A flag: the first deal animation ran | `src/ui/title.ts:5`, `:10`, `:16` | The first deal shows one more time. |
| `kingdown-sound` | The sound switch on the online game page | `src/account-game/runtime.ts:682`, `:686` | The switch goes back to off. |
| `kingdown.account-command.<userId>` | The receipt of an online command that was sent but not confirmed | `src/online/runtime.ts:20-35` | The retry of one unconfirmed move or game request. The server keeps the real game state. |
| `kingdown.account-game.<userId>` | The online page state (screen, selected game) | `src/online/runtime.ts:123-126`, `:149` | The online page opens on its first screen. |
| `kingdown.tricks` | Seals found (Tricks is parked) | `src/trick-store.ts:3` | Parked feature; no loss in the lean build. |
| `kingdown.workshop` | Up to 50 piece designs (Workshop is parked) | `src/workshop/store.ts:9-10` | Parked feature; no loss in the lean build. |

### sessionStorage (lost when the app process stops; this is expected)

| Key | Where | Effect of loss |
| --- | --- | --- |
| `kingdown.title-seen` | `src/main.ts:135-136`; `src/ui/title.ts:34`; `src/ui/home-view.ts:40` | The title shows again. |
| `kingdown.email-code` (address and time, for one hour) | `src/account/email-code.ts:3-12` | The player types the address again. |
| `kingdown.account-signin` | `src/online/sign-in.ts:5`, `:31-53` | A sign-in that is in progress starts again. |
| `kingdown.account-page.<userId>` | `src/online/page-host.ts:25-32` | The online page loses its route. |

### Cache Storage

- **Fact (code).** `src/online/cache-policy.ts:25`, `:117-126`, `:166-179` registers a service worker and deletes old `kingdown-*` caches before online play. It keeps no player data.
- **Fact (earlier report).** WKWebView gives service workers only to App-Bound Domains over http(s), not to a custom scheme (`docs/research/ios-app-2026-11-07/store-and-webview-rules.md`, section "Service workers, custom schemes and App-Bound Domains").

**Inference.** Two keys carry real player value: `kingdown.save` (no other copy for a player who is not signed in) and `kingdown.auth` (the sign-in). The other keys are small conveniences or have a cloud copy.

## 2. Where the data lives and which store the app uses

- **Fact (Capacitor source).** `CAPBridgeViewController` makes a plain `WKWebViewConfiguration()` and does not set `websiteDataStore` (`node_modules/@capacitor/ios/Capacitor/Capacitor/CAPBridgeViewController.swift:119-126`). It loads the app through a URL scheme handler (`:297`).
- **Fact (Apple).** "If you don’t assign a value to this property, the configuration object uses the default data store object to store data persistently." https://developer.apple.com/documentation/webkit/wkwebviewconfiguration/websitedatastore
- **Fact (Apple).** The default store "saves website data persistently to disk"; `nonPersistent()` keeps data only in memory. https://developer.apple.com/documentation/webkit/wkwebsitedatastore, https://developer.apple.com/documentation/webkit/wkwebsitedatastore/default()
- **Fact (WebKit source).** In an app, the general storage folder (localStorage, IndexedDB) is `Library/WebKit/<bundle id>/WebsiteData/Default`. WebKit moves old files from the earlier `Library/Caches/.../Storage` folder into it. https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/UIProcess/WebsiteData/Cocoa/WebsiteDataStoreCocoa.mm#L393-L420 and `#L598-L612` of the same file.
- **Fact (Apple, archived guide, updated 2018-04-09).** The contents of `Library`, except `Caches`, are backed up by iTunes and iCloud. The system may delete `Library/Caches` "when the system is very low on disk space". https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/FileSystemOverview/FileSystemOverview.html
- **Fact (code).** The deployment target is iOS 16.4 (`ios/App/App.xcodeproj/project.pbxproj:241`). The quota numbers in section 3.2 apply to iOS 17 and later.

**Inference.** The data is in `Library`, not in `Caches`. The iOS low-disk purge of `Caches` does not delete it. Only WebKit's own rules (section 3) and the events in section 4 can.

## 3. When WebKit can delete the data while the app stays installed

### 3.1 Intelligent Tracking Prevention: yes, it runs in this app, with a 30-day-of-use window

- **Fact (WebKit blog, 2020-06-26).** "In iOS 14.0 and macOS Big Sur, Intelligent Tracking Prevention (ITP), is enabled by default in all WKWebView applications." An app can add `NSCrossWebsiteTrackingUsageDescription` to show a switch in Settings. https://webkit.org/blog/10882/app-bound-domains/
- **Fact (WebKit source).** A non-browser app that has no `NSCrossWebsiteTrackingUsageDescription` has ITP on. https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/Shared/Cocoa/DefaultWebBrowserChecks.mm#L118-L126
- **Fact (WebKit blog, 2020-03-24).** ITP deletes "all of a website’s script-writable storage after seven days of Safari use without user interaction on the site": IndexedDB, localStorage, media keys, sessionStorage, service worker registrations and cache. Home Screen web apps "have their own counter of days of use", and WebKit does "not expect the first-party in such a web application to have its website data deleted". The post says nothing about WKWebView apps. https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- **Fact (WebKit source).** On Apple platforms every app gets first-party data removal mode `AllButCookies` unless a debug flag turns it off. https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/UIProcess/WebsiteData/Cocoa/WebsiteDataStoreCocoa.mm#L172-L186
- **Fact (WebKit source).** ITP records a user interaction for the main frame URL unless it is `about:`, `file:` or empty. A `capacitor:` page is recorded. https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/WebProcess/WebCoreSupport/WebResourceLoadObserver.cpp#L371-L394
- **Fact (WebKit source).** The domain of `capacitor://localhost` is its host, `localhost` (no public suffix). https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebCore/platform/RegistrableDomain.h#L118-L132
- **Fact (WebKit source).** Outside Safari, ITP does not include `localhost` in its classifier (`shouldIncludeLocalhost = isSafari`). https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/UIProcess/WebsiteData/Cocoa/WebsiteDataStoreCocoa.mm#L225 But `shouldSkip` blocks only the "prevalent" (tracker) checks, not the first-party removal. https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/NetworkProcess/Classifier/ResourceLoadStatisticsStore.cpp#L396-L401
- **Fact (WebKit source).** ITP removes a domain's script-written storage when it has no user interaction inside the window. The window is "Long" (30 operating dates), or "Short" (7) only for a domain that a known tracker sent the player to with link decoration. https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/NetworkProcess/Classifier/ResourceLoadStatisticsStore.cpp#L74-L75, `#L2898-L2920`, `#L2105-L2120`
- **Fact (WebKit source).** An operating date is a day on which this app's ITP store opened (the store adds "today" when it starts). Until 30 such days exist, the Long window has no start and nothing expires. https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/NetworkProcess/Classifier/ResourceLoadStatisticsStore.cpp#L372-L381, `#L3346-L3355`, `#L3402-L3416`
- **Fact (WebKit source).** Exempt domains are app-bound domains, managed (MDM) domains, persisted domains and the standalone web app domain. https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/NetworkProcess/Classifier/ResourceLoadStatisticsStore.cpp#L806-L818 But WebKit does not forward `WKAppBoundDomains` to ITP: `isAppBoundITPRelaxationEnabled` is the constant `false`. https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/UIProcess/WebsiteData/WebsiteDataStore.h#L602

**Inference.** ITP can delete King Down's localStorage. It does so only when the player has not tapped the game on any of the last 30 days on which the app started. The days when the app does not start do not count. A player who opens the app and plays resets the window with each tap. The risk is near zero for a game, but no WebKit page says so for WKWebView apps, and this reading comes from `main`, not from the shipped iOS. App-Bound Domains do not give an exemption.

### 3.2 Quota eviction: possible only above 20% of the disk

- **Fact (WebKit blog, 2023-08-10, iOS 17 and later).** For an app that is not a browser, the origin quota is up to 15% of the disk and the overall quota is up to 20%. Eviction "can happen ... when exceeding the overall quota, when the system is under storage pressure, or when the site has not been interacted with by the user for some time". WebKit evicts whole origins, least recently used first. An origin with an active page, or in persistent mode, can be skipped. The policy covers localStorage, Cache API, IndexedDB, service workers and File System. https://webkit.org/blog/14403/updates-to-storage-policy/
- **Fact (WebKit source).** Quota eviction runs when total use is above the total quota. It skips an active origin and a persisted origin. https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/NetworkProcess/storage/NetworkStorageManager.cpp#L588-L618
- **Fact (WebKit source).** A newer time-based eviction (threshold check every 7 days) is off for every app that is not a full browser. https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/UIProcess/WebsiteData/WebsiteDataStore.cpp#L2005-L2015, https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/NetworkProcess/storage/NetworkStorageManager.cpp#L106

**Inference.** The quota is per app, and King Down's data is a few kilobytes on one origin. Quota eviction cannot start from this app's own use.

### 3.3 Storage-pressure eviction: claimed, not found in the source

- **Fact (WebKit blog).** The 2023 post names "storage pressure" as a cause (source above).
- **Fact (Capacitor docs, v8).** "the OS will reclaim local storage from Web Views if a device is running low on space", and IndexedDB has the same risk "at least on iOS". https://capacitorjs.com/docs/guides/storage
- **Fact (Capacitor docs, v8).** "Mobile OSs may periodically clear data set in window.localStorage, so this API should be used instead." https://capacitorjs.com/docs/apis/preferences
- **Finding.** In `NetworkStorageManager.cpp` this report found eviction only by total quota and by time (off for apps). It found no low-disk trigger. Apple documents a low-disk purge only for `Library/Caches` and `tmp` (section 2).

**Inference.** Treat storage-pressure loss as possible but not proven. Capacitor's warning names no Apple or WebKit source. A device test cannot easily cause it.

### 3.4 `navigator.storage.persist()` does not help this app

- **Fact (WebKit blog).** WebKit grants `persist()` "based on heuristics like whether the website is opened as a Home Screen Web App" (2023 post above).
- **Fact (WebKit source).** `persist()` is granted only when the domain is in the set that is exempt from website data deletion (section 3.1 list). https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/NetworkProcess/storage/NetworkStorageManager.cpp#L882-L949

**Inference.** In King Down, `persist()` returns `false`. Do not build on it.

## 4. Other events: update, offload, restore, uninstall

| Event | Web storage | Source |
| --- | --- | --- |
| App update | Kept. The data is in the app container's `Library`, not in the app bundle. No source found that says an update deletes `Library/WebKit`. | **Inference** from the folder layout (section 2). No current Apple page on updates was found; a device test must show it. |
| Offload (manual, or "Offload Unused Apps") | Kept. Apple: offload "frees up storage used by the app, but keeps its documents and data". Delete "removes the app and its related data". | https://support.apple.com/en-us/108429 |
| iCloud or computer backup, then restore | Kept, with one gap. WebKit excludes a new origin folder from backup for its first 24 hours. It includes the folder at the first storage use after those 24 hours. Commit message: "we now only back up origin directories if user visits the origin multiple times." | https://github.com/WebKit/WebKit/blob/b2d2c2de1c74e095233e4ed243272fa7f0f89698/Source/WebKit/NetworkProcess/storage/NetworkStorageManager.cpp#L98, `#L387-L401`, `#L437-L441`; commit https://github.com/WebKit/WebKit/commit/d3c10b0ee8a18257ab091a135dbc10fb3ab12163 (2022-07-14, https://bugs.webkit.org/show_bug.cgi?id=242605) |
| Uninstall | Lost, with every container store: localStorage, `UserDefaults` and Capacitor Preferences ("Stored data is cleared if the app is uninstalled"). | https://capacitorjs.com/docs/apis/preferences; https://support.apple.com/en-us/108429 |
| App process stops (swipe away, iOS ends it) | localStorage stays; sessionStorage goes (it lives for one browsing session). | **Inference**; section 1 lists the sessionStorage keys. |

**Inference.** A player who installs, plays one session, and restores a backup made in the next 24 hours loses the save. After the second visit on a later day, the backup has it.

## 5. The documented fix and its costs

- **Fact (Capacitor docs).** Capacitor Preferences "avoids the eviction issues above, but is meant for small amounts of data" (storage guide). It uses `UserDefaults` on iOS. It is "not meant to be used as a local database". The privacy manifest needs `NSPrivacyAccessedAPICategoryUserDefaults` with reason `CA92.1`. Install: `npm install @capacitor/preferences` and `npx cap sync`. https://capacitorjs.com/docs/guides/storage, https://capacitorjs.com/docs/apis/preferences
- **Fact (npm).** `@capacitor/preferences` 8.0.1 is the current version; its peer is `@capacitor/core >=8.0.0` (`npm view @capacitor/preferences`, 2026-11-08).
- **Fact (plugin source).** The iOS plugin writes to `UserDefaults.standard`. https://github.com/ionic-team/capacitor-plugins/blob/main/preferences/ios/Sources/PreferencesPlugin/Preferences.swift
- **Fact (Apple).** `UserDefaults` stores data "on disk in an unencrypted format". "Don’t store personal or sensitive information as settings ... Store personal or sensitive information in the person’s Keychain instead." Backups include the defaults database. https://developer.apple.com/documentation/foundation/userdefaults
- **Fact (Apple).** `isExcludedFromBackup` "exists only to provide guidance to the system"; app data that the user makes is "nonpurgeable" and belongs in the backup. https://developer.apple.com/documentation/foundation/optimizing-your-app-s-data-for-icloud-backup
- **Fact (Supabase types).** The Supabase auth `storage` option accepts `getItem`, `setItem` and `removeItem` that return a value or a Promise (`SupportedStorage = PromisifyMethods<...>`, `node_modules/@supabase/auth-js/dist/module/lib/types.d.ts:1905`, version 2.117.2).
- **Fact (code).** The game reads the save at boot with synchronous calls (`src/screen/save.ts:45-86`; `src/main.ts:100`). `Sync` and `createWebTransport` take a synchronous `Storage`-like object (`src/account/sync.ts:27-28`; `src/online/runtime.ts:20`).

**Inference.** Preferences is asynchronous, and the game boot is synchronous. A full move to Preferences changes the boot order and every store. The smallest safe shape is a mirror: localStorage stays the working store; each write of a named key also goes to native storage; at boot, before the first read, one `await` copies native values back when localStorage has lost them. The session token belongs in the Keychain, not in `UserDefaults` (Apple's rule above). Capacitor has no first-party Keychain plugin; a small native bridge or a third-party plugin is needed. This report did not check any third-party plugin.

## 6. Recommendation

**Keep web storage for the first TestFlight builds.** No change is needed for the play test. The source shows no deletion path that a player who plays the game will meet: ITP needs 30 days of app starts with no tap; quota eviction needs 20% of the disk; time-based eviction is off for apps; the update and offload keep the data.

**With the redesign, mirror two groups of keys to native storage.**

1. `kingdown.save`, `kingdown.lessons`, `kingdown.sync`, `kingdown.sync-owner`, `kingdown.local.*` and `kingdown.new-game`: mirror to `@capacitor/preferences` (write-through; restore at boot when localStorage is empty). Move these keys as one group, because `src/account/local.ts:3-6` treats them as one unit.
2. `kingdown.auth`: give Supabase a `storage` adapter that keeps the session in the Keychain (`src/account/client.ts:23-26`). The adapter may be async (section 5).

Do not move the other keys. Do not use `navigator.storage.persist()` or App-Bound Domains to protect storage; neither helps this app (sections 3.1 and 3.4). Add `CA92.1` to `ios/App/App/PrivacyInfo.xcprivacy` when the app first uses `UserDefaults`.

Do it sooner only if a device test or a TestFlight player shows a lost save while the app stayed installed.

**What a device test must still show** (iPhone with the TestFlight build; use Safari > Develop > the device > the app's web view to read localStorage):

1. Kill and relaunch: make a move, swipe the app away at once, open it. The move and `kingdown.auth` are still there. (This also tests a write that has not reached the disk.)
2. Update: install build N, play, install build N+1 over it. The game and the sign-in stay.
3. Offload: Settings > General > iPhone Storage > King Down > Offload App, then reinstall. The game and the sign-in stay.
4. In the web view console: `await navigator.storage.persisted()`, `await navigator.storage.persist()` and `await navigator.storage.estimate()`. Expect `false`, `false`, and a quota near 15% of the disk on iOS 17 or later.
5. Folder and backup flag: in Xcode, Devices and Simulators, download the app container. Confirm that localStorage is under `Library/WebKit/.../WebsiteData/Default/`, not under `Library/Caches`.
6. Backup gap (optional): play once, make an encrypted computer backup in the same hour, restore it to a test device. Expect the save to be missing. Repeat after a second visit more than 24 hours later; expect the save to be present.

ITP's 30-day path cannot be shown on a device in a short test; this report relies on the source for it.

## Sources

- WebKit blog, App-Bound Domains (ITP in WKWebView), 2020-06-26: https://webkit.org/blog/10882/app-bound-domains/
- WebKit blog, Full Third-Party Cookie Blocking and More (7-day cap), 2020-03-24: https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- WebKit blog, Updates to Storage Policy, 2023-08-10: https://webkit.org/blog/14403/updates-to-storage-policy/
- Apple, WKWebsiteDataStore: https://developer.apple.com/documentation/webkit/wkwebsitedatastore and `/default()`, `/nonpersistent()`
- Apple, WKWebViewConfiguration.websiteDataStore: https://developer.apple.com/documentation/webkit/wkwebviewconfiguration/websitedatastore
- Apple, UserDefaults: https://developer.apple.com/documentation/foundation/userdefaults
- Apple, Optimizing your app's data for iCloud Backup: https://developer.apple.com/documentation/foundation/optimizing-your-app-s-data-for-icloud-backup
- Apple, File System Programming Guide (archived, 2018-04-09): https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/FileSystemOverview/FileSystemOverview.html
- Apple Support, How to check the storage on your iPhone and iPad (offload): https://support.apple.com/en-us/108429
- Capacitor, Data Storage guide (v8): https://capacitorjs.com/docs/guides/storage
- Capacitor, Preferences API (v8): https://capacitorjs.com/docs/apis/preferences
- Capacitor Preferences iOS source: https://github.com/ionic-team/capacitor-plugins/blob/main/preferences/ios/Sources/PreferencesPlugin/Preferences.swift
- Capacitor iOS 8.6.0 source (local): `node_modules/@capacitor/ios/Capacitor/Capacitor/CAPBridgeViewController.swift`
- WebKit source, commit `b2d2c2de1c74` (main, 2026-11-08): `Source/WebKit/UIProcess/WebsiteData/Cocoa/WebsiteDataStoreCocoa.mm`, `Source/WebKit/UIProcess/WebsiteData/WebsiteDataStore.cpp` and `.h`, `Source/WebKit/Shared/Cocoa/DefaultWebBrowserChecks.mm`, `Source/WebKit/NetworkProcess/Classifier/ResourceLoadStatisticsStore.cpp`, `Source/WebKit/WebProcess/WebCoreSupport/WebResourceLoadObserver.cpp`, `Source/WebKit/NetworkProcess/storage/NetworkStorageManager.cpp`, `Source/WebCore/platform/RegistrableDomain.h` (full links in the sections above)
- WebKit commit d3c10b0ee8 (backup exclusion for 24 hours), 2022-07-14: https://github.com/WebKit/WebKit/commit/d3c10b0ee8a18257ab091a135dbc10fb3ab12163
