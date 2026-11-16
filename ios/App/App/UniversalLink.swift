import Foundation

enum UniversalLink {
    static func localURL(_ url: URL, base: URL, soloLaunch: Bool = false) -> URL? {
        guard let link = URLComponents(url: url, resolvingAgainstBaseURL: false),
              link.scheme?.lowercased() == "https", link.host?.lowercased() == "kingdown.dev",
              link.user == nil, link.password == nil, link.port == nil,
              link.percentEncodedPath.range(of: #"^/(?:g/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/?|j/?)$"#, options: .regularExpression) != nil,
              var local = URLComponents(url: base, resolvingAgainstBaseURL: false) else { return nil }
        let invite = link.path.hasPrefix("/j")
        local.percentEncodedPath = soloLaunch && invite ? "/next.html" : link.percentEncodedPath
        local.query = nil
        local.percentEncodedFragment = invite ? (soloLaunch ? "join=" + (link.percentEncodedFragment ?? "") : link.percentEncodedFragment) : nil
        return local.url
    }
}
