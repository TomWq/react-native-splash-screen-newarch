declare module "react-native-splash-screen-newarch" {
    interface SplashScreenModule {
        hide(): void;
        show(): void;
    }

    const SplashScreen: SplashScreenModule;
    export default SplashScreen;
}
