import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = AppViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

/// The app shell: the site's page routes and the swipe that is the browser Back (docs/IOS.md).
class AppViewController: CAPBridgeViewController {
    override func router() -> Router { AppRouter() }

    override func capacitorDidLoad() {
        webView?.allowsBackForwardNavigationGestures = true
    }

    #if DEBUG
    /// A simulator check opens one start address: `xcrun simctl launch booted dev.kingdown.app -KingDownStart /support.html`.
    override func viewDidLoad() {
        super.viewDidLoad()
        if let start = UserDefaults.standard.string(forKey: "KingDownStart"), let base = bridge?.config.serverURL,
           let url = URL(string: start, relativeTo: base) {
            webView?.load(URLRequest(url: url))
        }
    }
    #endif
}

/// A page path loads index.html, as in the Capacitor template. The launch build (`KINGDOWN_SOLO_LAUNCH=1` writes the marker)
/// loads the new page instead, and keeps the old page for the online paths: the host routes of tools/plugin-server-build.mjs.
struct AppRouter: Router {
    static let marker = "solo-launch.json"
    static let onlinePages = #"^/(?:play(?:/.*)?|g/[^/]+/?|j/?)$"#
    var basePath = ""

    func route(for path: String) -> String {
        guard URL(fileURLWithPath: path).pathExtension.isEmpty else { return basePath + path }
        guard FileManager.default.fileExists(atPath: basePath + "/" + Self.marker) else { return basePath + "/index.html" }
        return basePath + (path.range(of: Self.onlinePages, options: .regularExpression) == nil ? "/next.html" : "/index.html")
    }
}
