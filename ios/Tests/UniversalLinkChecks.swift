import Foundation

@main
enum UniversalLinkChecks {
    static func main() {
        let base = URL(string: "capacitor://localhost")!
        let game = "12345678-1234-1234-1234-123456789abc"
        let accepted = [
            ("HTTPS://KINGDOWN.DEV/j#ABC234", "capacitor://localhost/j#ABC234"),
            ("https://kingdown.dev/g/\(game)", "capacitor://localhost/g/\(game)"),
            ("https://kingdown.dev/g/\(game)/", "capacitor://localhost/g/\(game)/"),
            ("https://kingdown.dev/g/\(game)?code=untrusted#untrusted", "capacitor://localhost/g/\(game)"),
            ("https://kingdown.dev/j", "capacitor://localhost/j"),
            ("https://kingdown.dev/j/", "capacitor://localhost/j/"),
            ("https://kingdown.dev/j#ABC234", "capacitor://localhost/j#ABC234"),
            ("https://kingdown.dev/j#" + String(repeating: "a", count: 43), "capacitor://localhost/j#" + String(repeating: "a", count: 43)),
            ("https://kingdown.dev/j?redirect=https://other.test#AB%20C234", "capacitor://localhost/j#AB%20C234")
        ]
        for (input, expected) in accepted {
            precondition(UniversalLink.localURL(URL(string: input)!, base: base)?.absoluteString == expected, input)
        }
        let rejected = [
            "http://kingdown.dev/j", "capacitor://localhost/j", "https://other.test/j",
            "https://kingdown.dev.other.test/j", "https://www.kingdown.dev/j",
            "https://user@kingdown.dev/j", "https://user:pass@kingdown.dev/j",
            "https://kingdown.dev:444/j", "https://kingdown.dev:443/j",
            "https://kingdown.dev/", "https://kingdown.dev/play", "https://kingdown.dev/next.html",
            "https://kingdown.dev/j/extra", "https://kingdown.dev/g/not-a-game",
            "https://kingdown.dev/g/\(game)/extra", "https://kingdown.dev/g/\(game).html",
            "https://kingdown.dev/%6a", "https://kingdown.dev/j%2f", "https://kingdown.dev/g/%2e%2e/j",
            "https://kingdown.dev/../j", "https://kingdown.dev//j"
        ]
        for input in rejected {
            precondition(UniversalLink.localURL(URL(string: input)!, base: base) == nil, input)
        }
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try! FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }
        let router = AppRouter(basePath: root.path)
        for launch in [false, true] {
            let marker = root.appendingPathComponent(AppRouter.marker)
            if launch { try! Data("{}".utf8).write(to: marker) }
            for (input, oldURL) in accepted {
                let url = UniversalLink.localURL(URL(string: input)!, base: base, soloLaunch: launch)!
                let invite = URL(string: input)!.path.hasPrefix("/j")
                let expected = launch && invite ? "capacitor://localhost/next.html#join=" + (URLComponents(string: oldURL)!.percentEncodedFragment ?? "") : oldURL
                precondition(url.absoluteString == expected, input)
                precondition(url.query == nil, input)
                let destination = router.route(for: url.path)
                precondition(destination == root.path + (launch && invite ? "/next.html" : "/index.html"), input)
                if launch && invite { precondition(url.fragment?.hasPrefix("join=") == true, input) }
            }
        }
        print("Native invite route checks: \(accepted.count * 2) passed")
        print("Universal link checks: \(accepted.count + rejected.count) passed")
    }
}
