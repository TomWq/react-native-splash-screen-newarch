import Foundation
import UIKit

@objc(RNSplashScreenManager)
@objcMembers
public final class RNSplashScreenManager: NSObject {
    private static let maxWaitTime: TimeInterval = 10
    private static let defaultScaleFadeTarget: CGFloat = 1.08
    private static let minScaleFadeTarget: CGFloat = 1
    private static let maxScaleFadeTarget: CGFloat = 1.3
    private static let defaultLaunchScreenName = "LaunchScreen"
    private static var waiting = true
    private static var addedJsLoadErrorObserver = false
    private static var loadingView: UIView?
    private static var loadingWindow: UIWindow?
    private static weak var previousKeyWindow: UIWindow?
    private static var pendingHideOptions: HideOptions?

    private struct HideOptions {
        let animation: String
        let duration: Double
        let scale: CGFloat
    }

    public class func show() {
        if !Thread.isMainThread {
            DispatchQueue.main.sync {
                show()
            }
            return
        }

        if !addedJsLoadErrorObserver {
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(jsLoadError(_:)),
                name: Notification.Name(rawValue: "RCTJavaScriptDidFailToLoadNotification"),
                object: nil
            )
            addedJsLoadErrorObserver = true
        }

        prepareLoadingView()

        let deadline = Date().addingTimeInterval(maxWaitTime)
        while waiting && Date() < deadline {
            RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.1))
        }

        let timedOut = waiting
        waiting = false
        removeJsLoadErrorObserver()

        if timedOut {
            removeLoadingView(animation: "none", duration: 0, scale: defaultScaleFadeTarget)
        } else if let pendingHideOptions {
            self.pendingHideOptions = nil
            scheduleRemoveLoadingView(with: pendingHideOptions)
        }
    }

    public class func showSplash(_ splashScreen: String, inRootView rootView: UIView) {
        if !Thread.isMainThread {
            DispatchQueue.main.async {
                showSplash(splashScreen, inRootView: rootView)
            }
            return
        }

        if loadingView == nil {
            loadingView = createLoadingView(named: splashScreen, in: rootView)
        }

        waiting = false

        if let loadingView, loadingView.superview == nil {
            rootView.addSubview(loadingView)
        }
    }

    public class func hide() {
        hide(animation: "none", duration: 0, scale: Double(defaultScaleFadeTarget))
    }

    public class func hide(animation: String, duration: Double) {
        hide(animation: animation, duration: duration, scale: Double(defaultScaleFadeTarget))
    }

    public class func hide(animation: String, duration: Double, scale: Double) {
        if !Thread.isMainThread {
            DispatchQueue.main.async {
                hide(animation: animation, duration: duration, scale: scale)
            }
            return
        }

        removeJsLoadErrorObserver()

        let hideOptions = HideOptions(
            animation: animation,
            duration: duration,
            scale: safeScaleFadeTarget(scale)
        )

        if waiting {
            pendingHideOptions = hideOptions
            waiting = false
        } else {
            scheduleRemoveLoadingView(with: hideOptions)
        }
    }

    @objc
    private class func jsLoadError(_ notification: Notification) {
        hide()
    }

    private class func removeJsLoadErrorObserver() {
        guard addedJsLoadErrorObserver else { return }

        NotificationCenter.default.removeObserver(
            self,
            name: Notification.Name(rawValue: "RCTJavaScriptDidFailToLoadNotification"),
            object: nil
        )
        addedJsLoadErrorObserver = false
    }

    private class func prepareLoadingView() {
        guard loadingView == nil else {
            return
        }

        let overlayWindow = createLoadingWindow()
        guard let containerView = overlayWindow.rootViewController?.view else {
            return
        }

        loadingView = createLoadingView(
            named: launchScreenName(),
            in: containerView
        )

        if let loadingView, loadingView.superview == nil {
            containerView.addSubview(loadingView)
            loadingWindow = overlayWindow
            previousKeyWindow = currentKeyWindow()
            overlayWindow.makeKeyAndVisible()
        }
    }

    private class func createLoadingWindow() -> UIWindow {
        let window: UIWindow

        if #available(iOS 13.0, *), let windowScene = currentWindowScene() {
            window = UIWindow(windowScene: windowScene)
        } else {
            window = UIWindow(frame: UIScreen.main.bounds)
        }

        window.frame = UIScreen.main.bounds
        window.backgroundColor = .clear
        window.windowLevel = .alert + 1
        window.isUserInteractionEnabled = false
        window.rootViewController = UIViewController()
        window.rootViewController?.view.frame = window.bounds
        window.rootViewController?.view.backgroundColor = .clear
        window.isHidden = true
        return window
    }

    private class func currentKeyWindow() -> UIWindow? {
        if #available(iOS 13.0, *) {
            let activeWindow = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first { $0.isKeyWindow }

            if let activeWindow {
                return activeWindow
            }
        }

        return UIApplication.shared.keyWindow
    }

    @available(iOS 13.0, *)
    private class func currentWindowScene() -> UIWindowScene? {
        if let keyWindowScene = currentKeyWindow()?.windowScene {
            return keyWindowScene
        }

        let scenes = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }

        if let activeScene = scenes.first(where: { $0.activationState == .foregroundActive }) {
            return activeScene
        }

        if let inactiveScene = scenes.first(where: { $0.activationState == .foregroundInactive }) {
            return inactiveScene
        }

        return scenes.first
    }

    private class func launchScreenName() -> String {
        Bundle.main.object(
            forInfoDictionaryKey: "UILaunchStoryboardName"
        ) as? String ?? defaultLaunchScreenName
    }

    private class func createLoadingView(named name: String, in containerView: UIView) -> UIView? {
        let view = createStoryboardView(named: name) ?? createNibView(named: name)

        guard let view else {
            return nil
        }

        let frame = containerView.bounds.isEmpty ? UIScreen.main.bounds : containerView.bounds
        view.frame = frame
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.isUserInteractionEnabled = false
        view.alpha = 1
        view.transform = .identity
        view.setNeedsLayout()
        view.layoutIfNeeded()
        return view
    }

    private class func createStoryboardView(named name: String) -> UIView? {
        guard Bundle.main.path(forResource: name, ofType: "storyboardc") != nil else {
            return nil
        }

        return UIStoryboard(
            name: name,
            bundle: Bundle.main
        ).instantiateInitialViewController()?.view
    }

    private class func createNibView(named name: String) -> UIView? {
        guard Bundle.main.path(forResource: name, ofType: "nib") != nil else {
            return nil
        }

        return Bundle.main.loadNibNamed(name, owner: self, options: nil)?.first as? UIView
    }

    private class func safeScaleFadeTarget(_ scale: Double) -> CGFloat {
        guard scale.isFinite else {
            return defaultScaleFadeTarget
        }

        return min(max(CGFloat(scale), minScaleFadeTarget), maxScaleFadeTarget)
    }

    private class func scheduleRemoveLoadingView(with options: HideOptions) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            removeLoadingView(
                animation: options.animation,
                duration: options.duration,
                scale: options.scale
            )
        }
    }

    private class func removeLoadingView(animation: String, duration: Double, scale: CGFloat) {
        guard let loadingView else {
            clearLoadingView()
            return
        }

        if (animation == "fade" || animation == "scaleFade") && duration > 0 {
            UIView.animate(
                withDuration: duration / 1000,
                delay: 0,
                options: [.curveEaseOut, .beginFromCurrentState],
                animations: {
                    loadingView.alpha = 0
                    if animation == "scaleFade" {
                        loadingView.transform = CGAffineTransform(
                            scaleX: scale,
                            y: scale
                        )
                    }
                },
                completion: { _ in
                    clearLoadingView()
                }
            )
        } else {
            clearLoadingView()
        }
    }

    private class func clearLoadingView() {
        loadingView?.removeFromSuperview()
        loadingView = nil
        loadingWindow?.isHidden = true
        loadingWindow?.rootViewController = nil
        loadingWindow = nil
        previousKeyWindow?.makeKey()
        previousKeyWindow = nil
    }
}
