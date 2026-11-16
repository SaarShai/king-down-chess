import AuthenticationServices
import Capacitor

/// The Apple sheet returns to the same web view. No token enters a URL or a log.
@objc(AppleSignInPlugin)
public class AppleSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    public let identifier = "AppleSignInPlugin"
    public let jsName = "KingDownAppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise)]
    private var pending: CAPPluginCall?
    private var controller: ASAuthorizationController?
    private var expectedState: String?
    private var anchor: ASPresentationAnchor?

    @objc func authorize(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.pending == nil else { call.reject("Sign-in is already open", "BUSY"); return }
            guard let nonce = call.getString("nonce"), let state = call.getString("state"),
                  nonce.range(of: "^[a-f0-9]{64}$", options: .regularExpression) != nil,
                  state.range(of: "^[a-f0-9]{64}$", options: .regularExpression) != nil,
                  let anchor = self.bridge?.viewController?.view.window else {
                call.reject("Invalid sign-in request"); return
            }
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.email]
            request.nonce = nonce
            request.state = state
            self.pending = call
            self.expectedState = state
            self.anchor = anchor
            let controller = ASAuthorizationController(authorizationRequests: [request])
            self.controller = controller
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return anchor!
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        defer { pending = nil; expectedState = nil; self.controller = nil; anchor = nil }
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              credential.state == expectedState, let state = credential.state,
              let bytes = credential.identityToken, let token = String(data: bytes, encoding: .utf8) else {
            pending?.reject("Invalid Apple sign-in return"); return
        }
        pending?.resolve(["identityToken": token, "state": state])
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let canceled = (error as? ASAuthorizationError)?.code == .canceled
        pending?.reject(canceled ? "Sign-in canceled" : "Apple sign-in failed", canceled ? "CANCELED" : "UNAVAILABLE")
        pending = nil; expectedState = nil; self.controller = nil; anchor = nil
    }
}
