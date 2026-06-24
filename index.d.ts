declare module "react-native-splash-screen-newarch" {
    type HideAnimation = "none" | "fade" | "scaleFade";

    interface HideOptions {
        animation?: HideAnimation;
        duration?: number;
        scale?: number;
    }

    interface SplashScreenModule {
        hide(options?: HideOptions): void;
        show(): void;
    }

    const SplashScreen: SplashScreenModule;
    export default SplashScreen;
}
