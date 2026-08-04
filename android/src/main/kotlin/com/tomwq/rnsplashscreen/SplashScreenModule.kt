package com.tomwq.rnsplashscreen

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = SplashScreenModule.NAME)
class SplashScreenModule(reactContext: ReactApplicationContext) :
    NativeSplashScreenSpec(reactContext) {

    override fun getName(): String = NAME

    @ReactMethod
    override fun show() {
        SplashScreen.show(reactApplicationContext.currentActivity)
    }

    @ReactMethod
    override fun hide(animation: String, duration: Double, scale: Double, easing: String) {
        SplashScreen.hide(
            reactApplicationContext.currentActivity,
            animation,
            duration.toLong(),
            scale.toFloat(),
            easing
        )
    }

    @ReactMethod
    override fun getStartupMetrics(promise: Promise) {
        promise.resolve(Arguments.makeNativeMap(SplashScreen.getStartupMetrics()))
    }

    companion object {
        const val NAME = "SplashScreen"
    }
}
