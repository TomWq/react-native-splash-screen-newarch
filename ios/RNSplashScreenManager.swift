import Foundation
import UIKit

@objc(RNSplashScreenManager)
@objcMembers
public final class RNSplashScreenManager: NSObject {
    private static let defaultMaxWaitTime: TimeInterval = 10
    private static let maxWaitTimeInfoPlistKey = "RNSplashScreenMaxWaitTime"
    private static let defaultScaleFadeTarget: CGFloat = 1.08
    private static let minScaleFadeTarget: CGFloat = 1
    private static let maxScaleFadeTarget: CGFloat = 1.3
    private static let defaultZoomOutFadeTarget: CGFloat = 0.92
    private static let minZoomOutFadeTarget: CGFloat = 0.7
    private static let maxZoomOutFadeTarget: CGFloat = 1
    private static let defaultLaunchScreenName = "LaunchScreen"
    private static var waiting = false
    private static var addedJsLoadErrorObserver = false
    private static var loadingView: UIView?
    private static var loadingWindow: UIWindow?
    private static weak var previousKeyWindow: UIWindow?
    private static var timeoutWorkItem: DispatchWorkItem?
    private static var removalWorkItem: DispatchWorkItem?
    private static var transitionGeneration: UInt = 0
    private static var showTime: Double?
    private static var hideRequestedTime: Double?
    private static var hiddenTime: Double?

    private struct HideOptions {
        let animation: String
        let duration: Double
        let scale: CGFloat
        let easing: String
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

        cancelTimeout()
        cancelScheduledRemoval()
        resetLoadingViewForShow()
        recordShow()
        prepareLoadingView()
        waiting = true
        scheduleTimeout()
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

        cancelTimeout()
        cancelScheduledRemoval()
        resetLoadingViewForShow()
        recordShow()
        removeJsLoadErrorObserver()
        waiting = false

        if let loadingView, loadingView.superview == nil {
            pinLoadingView(loadingView, to: rootView)
        }
    }

    public class func hide() {
        hide(
            animation: "none",
            duration: 0,
            scale: Double(defaultScaleFadeTarget),
            easing: "easeOut"
        )
    }

    public class func hide(animation: String, duration: Double) {
        hide(
            animation: animation,
            duration: duration,
            scale: Double(defaultScaleFadeTarget),
            easing: "easeOut"
        )
    }

    public class func hide(animation: String, duration: Double, scale: Double) {
        hide(animation: animation, duration: duration, scale: scale, easing: "easeOut")
    }

    public class func hide(animation: String, duration: Double, scale: Double, easing: String) {
        if !Thread.isMainThread {
            DispatchQueue.main.async {
                hide(animation: animation, duration: duration, scale: scale, easing: easing)
            }
            return
        }

        cancelTimeout()
        removeJsLoadErrorObserver()
        recordHideRequested()

        let hideOptions = HideOptions(
            animation: animation,
            duration: duration,
            scale: safeScaleTarget(scale, animation: animation),
            easing: easing
        )

        waiting = false
        scheduleRemoveLoadingView(with: hideOptions)
    }

    public class func startupMetrics() -> [String: Any] {
        let nativeVisibleDuration = durationBetween(showTime, hiddenTime)
        let hideDuration = durationBetween(hideRequestedTime, hiddenTime)

        return [
            "showTime": showTime as Any? ?? NSNull(),
            "hideRequestedTime": hideRequestedTime as Any? ?? NSNull(),
            "hiddenTime": hiddenTime as Any? ?? NSNull(),
            "nativeVisibleDuration": nativeVisibleDuration as Any? ?? NSNull(),
            "hideDuration": hideDuration as Any? ?? NSNull()
        ]
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
            pinLoadingView(loadingView, to: containerView)
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

    private class func maxWaitTime() -> TimeInterval {
        let configuredValue = Bundle.main.object(
            forInfoDictionaryKey: maxWaitTimeInfoPlistKey
        )

        if let number = configuredValue as? NSNumber {
            return max(0, number.doubleValue)
        }

        if let string = configuredValue as? String, let value = Double(string) {
            return max(0, value)
        }

        return defaultMaxWaitTime
    }

    private class func scheduleTimeout() {
        var workItem: DispatchWorkItem?
        workItem = DispatchWorkItem {
            guard
                let workItem,
                !workItem.isCancelled,
                timeoutWorkItem === workItem,
                waiting
            else {
                return
            }

            timeoutWorkItem = nil
            waiting = false
            removeJsLoadErrorObserver()
            let generation = nextTransitionGeneration()
            removeLoadingView(
                animation: "none",
                duration: 0,
                scale: defaultScaleFadeTarget,
                easing: "easeOut",
                generation: generation
            )
        }

        guard let workItem else { return }
        timeoutWorkItem = workItem
        DispatchQueue.main.asyncAfter(
            deadline: .now() + maxWaitTime(),
            execute: workItem
        )
    }

    private class func cancelTimeout() {
        timeoutWorkItem?.cancel()
        timeoutWorkItem = nil
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

    private class func pinLoadingView(_ loadingView: UIView, to containerView: UIView) {
        loadingView.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(loadingView)
        NSLayoutConstraint.activate([
            loadingView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            loadingView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
            loadingView.topAnchor.constraint(equalTo: containerView.topAnchor),
            loadingView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor)
        ])
        containerView.setNeedsLayout()
        containerView.layoutIfNeeded()
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

    private class func safeScaleTarget(_ scale: Double, animation: String) -> CGFloat {
        if animation == "zoomOutFade" {
            guard scale.isFinite else { return defaultZoomOutFadeTarget }
            return min(max(CGFloat(scale), minZoomOutFadeTarget), maxZoomOutFadeTarget)
        }

        guard scale.isFinite else { return defaultScaleFadeTarget }
        return min(max(CGFloat(scale), minScaleFadeTarget), maxScaleFadeTarget)
    }

    private class func scheduleRemoveLoadingView(with options: HideOptions) {
        cancelScheduledRemoval()
        let generation = nextTransitionGeneration()

        var workItem: DispatchWorkItem?
        workItem = DispatchWorkItem {
            guard
                let workItem,
                !workItem.isCancelled,
                removalWorkItem === workItem,
                transitionGeneration == generation
            else {
                return
            }

            removalWorkItem = nil
            removeLoadingView(
                animation: options.animation,
                duration: options.duration,
                scale: options.scale,
                easing: options.easing,
                generation: generation
            )
        }

        guard let workItem else { return }
        removalWorkItem = workItem
        DispatchQueue.main.async(execute: workItem)
    }

    private class func cancelScheduledRemoval() {
        removalWorkItem?.cancel()
        removalWorkItem = nil
    }

    private class func nextTransitionGeneration() -> UInt {
        transitionGeneration &+= 1
        return transitionGeneration
    }

    private class func resetLoadingViewForShow() {
        _ = nextTransitionGeneration()
        loadingView?.layer.removeAllAnimations()
        loadingView?.alpha = 1
        loadingView?.transform = .identity
    }

    private class func removeLoadingView(
        animation: String,
        duration: Double,
        scale: CGFloat,
        easing: String,
        generation: UInt
    ) {
        guard let loadingView else {
            if transitionGeneration == generation {
                clearLoadingView()
            }
            return
        }

        let supportsAnimation = [
            "fade",
            "scaleFade",
            "slideUpFade",
            "zoomOutFade"
        ].contains(animation)

        if supportsAnimation && duration > 0 && !UIAccessibility.isReduceMotionEnabled {
            UIView.animate(
                withDuration: duration / 1000,
                delay: 0,
                options: [animationOption(for: easing), .beginFromCurrentState],
                animations: {
                    loadingView.alpha = 0
                    if animation == "scaleFade" || animation == "zoomOutFade" {
                        loadingView.transform = CGAffineTransform(
                            scaleX: scale,
                            y: scale
                        )
                    } else if animation == "slideUpFade" {
                        let distance = max(24, loadingView.bounds.height * 0.08)
                        loadingView.transform = CGAffineTransform(
                            translationX: 0,
                            y: -distance
                        )
                    }
                },
                completion: { _ in
                    guard
                        transitionGeneration == generation,
                        self.loadingView === loadingView
                    else {
                        return
                    }

                    clearLoadingView()
                }
            )
        } else if transitionGeneration == generation {
            clearLoadingView()
        }
    }

    private class func animationOption(for easing: String) -> UIView.AnimationOptions {
        switch easing {
        case "linear":
            return .curveLinear
        case "easeIn":
            return .curveEaseIn
        case "easeInOut":
            return .curveEaseInOut
        default:
            return .curveEaseOut
        }
    }

    private class func clearLoadingView() {
        _ = nextTransitionGeneration()
        cancelTimeout()
        cancelScheduledRemoval()
        waiting = false
        loadingView?.removeFromSuperview()
        loadingView = nil
        loadingWindow?.isHidden = true
        loadingWindow?.rootViewController = nil
        loadingWindow = nil
        previousKeyWindow?.makeKey()
        previousKeyWindow = nil
        recordHidden()
    }

    private class func recordShow() {
        showTime = monotonicTimeMs()
        hideRequestedTime = nil
        hiddenTime = nil
    }

    private class func recordHideRequested() {
        guard showTime != nil, hideRequestedTime == nil, hiddenTime == nil else { return }
        hideRequestedTime = monotonicTimeMs()
    }

    private class func recordHidden() {
        guard showTime != nil, hiddenTime == nil else { return }
        hiddenTime = monotonicTimeMs()
    }

    private class func durationBetween(_ start: Double?, _ end: Double?) -> Double? {
        guard let start, let end else { return nil }
        return max(0, end - start)
    }

    private class func monotonicTimeMs() -> Double {
        ProcessInfo.processInfo.systemUptime * 1_000
    }
}
