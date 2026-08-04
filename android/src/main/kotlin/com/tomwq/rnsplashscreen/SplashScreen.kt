package com.tomwq.rnsplashscreen

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.app.Activity
import android.app.Application
import android.app.Dialog
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.drawable.NinePatchDrawable
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.provider.Settings
import android.view.View
import android.view.WindowManager
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.view.animation.LinearInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.core.graphics.drawable.toDrawable
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import java.lang.ref.WeakReference

@SuppressLint("StaticFieldLeak")
object SplashScreen {
    private const val DEFAULT_SCALE_FADE_TARGET = 1.08f
    private const val MIN_SCALE_FADE_TARGET = 1f
    private const val MAX_SCALE_FADE_TARGET = 1.3f
    private const val DEFAULT_ZOOM_OUT_FADE_TARGET = 0.92f
    private const val MIN_ZOOM_OUT_FADE_TARGET = 0.7f
    private const val MAX_ZOOM_OUT_FADE_TARGET = 1f
    private const val POST_SPLASH_SCREEN_THEME_META_DATA =
        "com.tomwq.rnsplashscreen.POST_SPLASH_SCREEN_THEME"
    private var splashDialog: Dialog? = null
    private var splashContentView: View? = null
    private var activityRef: WeakReference<Activity>? = null
    private enum class DisplayMode { DIALOG, SYSTEM }

    private var lifecycleApplication: Application? = null
    private var displayMode: DisplayMode? = null
    @Volatile private var systemSplashVisible = false
    @Volatile private var systemSplashGeneration = 0L
    private val metricsLock = Any()
    private var showTime: Double? = null
    private var hideRequestedTime: Double? = null
    private var hiddenTime: Double? = null
    private val activityLifecycleCallbacks = object : Application.ActivityLifecycleCallbacks {
        override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = Unit
        override fun onActivityStarted(activity: Activity) = Unit
        override fun onActivityResumed(activity: Activity) = Unit
        override fun onActivityPaused(activity: Activity) = Unit
        override fun onActivityStopped(activity: Activity) = Unit
        override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit

        override fun onActivityDestroyed(activity: Activity) {
            if (activityRef?.get() !== activity) return

            if (displayMode == DisplayMode.SYSTEM) {
                clearSystemSplash()
            } else {
                splashDialog?.let(::dismissDialog) ?: clearSplashDialog()
            }
        }
    }

    @JvmStatic
    fun applyPostSplashScreenTheme(activity: Activity?) {
        if (activity == null) return

        val themeResId = resolvePostSplashScreenTheme(activity)
        if (themeResId != 0) {
            activity.setTheme(themeResId)
        }
    }

    @JvmStatic
    fun show(activity: Activity?, themeResId: Int, fullScreen: Boolean) {
        if (activity == null) return

        activity.runOnUiThread {
            if (!isActivityActive(activity)) {
                return@runOnUiThread
            }

            if (displayMode == DisplayMode.SYSTEM) {
                systemSplashVisible = false
                clearSystemSplash()
            }

            splashDialog?.let { existingDialog ->
                val previousActivity = activityRef?.get()
                if (
                    existingDialog.isShowing &&
                    previousActivity === activity &&
                    isActivityActive(activity)
                ) {
                    resetSplashContentView()
                    recordShow()
                    return@runOnUiThread
                }

                dismissDialog(existingDialog)
            }

            activityRef = WeakReference(activity)
            displayMode = DisplayMode.DIALOG
            registerActivityLifecycleCallbacks(activity)
            recordShow()

            try {
                val contentView = createSplashContentView(activity)
                splashDialog = Dialog(activity, themeResId).apply {
                    splashContentView = contentView
                    setContentView(contentView)
                    setCancelable(false)
                    configureSplashWindow(this)
                    if (fullScreen) {
                        setActivityAndroidP(this)
                    }
                }

                if (splashDialog?.isShowing == false) {
                    splashDialog?.show()
                }
            } catch (_: WindowManager.BadTokenException) {
                clearSplashDialog()
            }
        }
    }

    @JvmStatic
    fun show(activity: Activity?, fullScreen: Boolean) {
        val resourceId =
            if (fullScreen) R.style.SplashScreen_Fullscreen else R.style.SplashScreen_SplashTheme
        show(activity, resourceId, fullScreen)
    }

    @JvmStatic
    fun show(activity: Activity?, fullScreen: Boolean, useSystemSplash: Boolean) {
        if (useSystemSplash) {
            showSystemSplash(activity)
        } else {
            show(activity, fullScreen)
        }
    }

    @JvmStatic
    fun show(activity: Activity?) {
        show(activity, false)
    }

    @JvmStatic
    fun hide(activity: Activity?) {
        hide(activity, "none", 0, DEFAULT_SCALE_FADE_TARGET, "easeOut")
    }

    @JvmStatic
    fun hide(activity: Activity?, animation: String, duration: Long) {
        hide(activity, animation, duration, DEFAULT_SCALE_FADE_TARGET, "easeOut")
    }

    @JvmStatic
    fun hide(activity: Activity?, animation: String, duration: Long, scale: Float) {
        hide(activity, animation, duration, scale, "easeOut")
    }

    @JvmStatic
    fun hide(
        activity: Activity?,
        animation: String,
        duration: Long,
        scale: Float,
        easing: String
    ) {
        val resolvedActivity = activity ?: activityRef?.get() ?: return
        recordHideRequested()
        resolvedActivity.runOnUiThread {
            if (
                displayMode == DisplayMode.SYSTEM &&
                activityRef?.get() === resolvedActivity
            ) {
                systemSplashVisible = false
                if (!isActivityActive(resolvedActivity)) {
                    clearSystemSplash()
                }
                return@runOnUiThread
            }

            val dialog = splashDialog
            if (dialog != null && dialog.isShowing) {
                if (!isActivityActive(resolvedActivity)) {
                    dismissDialog(dialog)
                    return@runOnUiThread
                }

                val contentView = splashContentView
                if (supportsAnimation(animation) &&
                    duration > 0 &&
                    contentView != null &&
                    areAnimationsEnabled(resolvedActivity)
                ) {
                    val animator = contentView.animate()
                        .alpha(0f)
                        .setDuration(duration)
                        .setInterpolator(interpolatorFor(easing))
                        .withEndAction {
                            dismissDialog(dialog)
                        }

                    if (animation == "scaleFade" || animation == "zoomOutFade") {
                        val safeScale = safeScaleTarget(scale, animation)
                        animator
                            .scaleX(safeScale)
                            .scaleY(safeScale)
                    } else if (animation == "slideUpFade") {
                        val minDistance = 24f * contentView.resources.displayMetrics.density
                        val distance = maxOf(minDistance, contentView.height * 0.08f)
                        animator.translationY(-distance)
                    }

                    animator
                        .start()
                } else {
                    dismissDialog(dialog)
                }
            } else {
                clearSplashDialog()
            }
        }
    }

    private fun showSystemSplash(activity: Activity?) {
        if (activity == null) return

        activity.runOnUiThread {
            if (!isActivityActive(activity)) return@runOnUiThread

            splashDialog?.let(::dismissDialog)
            if (displayMode == DisplayMode.SYSTEM) {
                systemSplashVisible = false
                clearSystemSplash()
            }

            val generation = ++systemSplashGeneration
            activityRef = WeakReference(activity)
            displayMode = DisplayMode.SYSTEM
            systemSplashVisible = true
            registerActivityLifecycleCallbacks(activity)
            recordShow()

            try {
                activity.installSplashScreen().apply {
                    setKeepOnScreenCondition {
                        systemSplashVisible &&
                            displayMode == DisplayMode.SYSTEM &&
                            activityRef?.get() === activity &&
                            systemSplashGeneration == generation
                    }
                    setOnExitAnimationListener { provider ->
                        provider.remove()
                        if (
                            displayMode == DisplayMode.SYSTEM &&
                            activityRef?.get() === activity &&
                            systemSplashGeneration == generation
                        ) {
                            systemSplashVisible = false
                            clearSystemSplash()
                        }
                    }
                }
            } catch (_: RuntimeException) {
                clearSystemSplash()
            }
        }
    }

    @JvmStatic
    fun getStartupMetrics(): Map<String, Double?> = synchronized(metricsLock) {
        val visibleDuration = durationBetween(showTime, hiddenTime)
        val hideDuration = durationBetween(hideRequestedTime, hiddenTime)
        linkedMapOf(
            "showTime" to showTime,
            "hideRequestedTime" to hideRequestedTime,
            "hiddenTime" to hiddenTime,
            "nativeVisibleDuration" to visibleDuration,
            "hideDuration" to hideDuration
        )
    }

    private fun configureSplashWindow(dialog: Dialog) {
        dialog.window?.let { window ->
            window.setBackgroundDrawable(Color.TRANSPARENT.toDrawable())
            window.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
            window.setDimAmount(0f)
            window.setWindowAnimations(0)
        }
    }

    private fun isActivityActive(activity: Activity): Boolean {
        val isDestroyed =
            activity.isDestroyed

        return !activity.isFinishing && !isDestroyed
    }

    private fun resolvePostSplashScreenTheme(activity: Activity): Int {
        val componentName = activity.componentName
        val activityInfo = try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                activity.packageManager.getActivityInfo(
                    componentName,
                    PackageManager.ComponentInfoFlags.of(PackageManager.GET_META_DATA.toLong())
                )
            } else {
                @Suppress("DEPRECATION")
                activity.packageManager.getActivityInfo(
                    componentName,
                    PackageManager.GET_META_DATA
                )
            }
        } catch (_: PackageManager.NameNotFoundException) {
            null
        }

        return activityInfo?.metaData?.getInt(POST_SPLASH_SCREEN_THEME_META_DATA, 0) ?: 0
    }

    @SuppressLint("UseCompatLoadingForDrawables", "DiscouragedApi")
    private fun createSplashContentView(activity: Activity): View {
        val layoutId = activity.resources.getIdentifier(
            "launch_screen",
            "layout",
            activity.packageName
        )

        if (layoutId != 0) {
            try {
                return activity.layoutInflater.inflate(layoutId, null)
            } catch (_: RuntimeException) {
                // Fall back to a lightweight native view when the host layout is missing or invalid.
            }
        }

        val drawableId = activity.resources.getIdentifier(
            "launch_screen",
            "drawable",
            activity.packageName
        )
        val mipmapId = activity.resources.getIdentifier(
            "launch_screen",
            "mipmap",
            activity.packageName
        )
        val imageId = if (drawableId != 0) drawableId else mipmapId

        return FrameLayout(activity).apply {
            if (imageId != 0) {
                val imageDrawable = activity.getDrawable(imageId)
                if (imageDrawable is NinePatchDrawable) {
                    background = imageDrawable
                } else {
                    setBackgroundColor(Color.BLACK)
                    addView(
                        ImageView(activity).apply {
                            setImageResource(imageId)
                            scaleType = ImageView.ScaleType.CENTER_CROP
                        },
                        FrameLayout.LayoutParams(
                            FrameLayout.LayoutParams.MATCH_PARENT,
                            FrameLayout.LayoutParams.MATCH_PARENT
                        )
                    )
                }
            } else {
                setBackgroundColor(Color.BLACK)
            }
        }
    }

    private fun dismissDialog(dialog: Dialog) {
        val ownsCurrentState = splashDialog === dialog
        if (ownsCurrentState) {
            cancelSplashAnimation()
        }

        try {
            dialog.dismiss()
        } catch (_: RuntimeException) {
            // The owning Activity may already be gone; clearing references is enough here.
        } finally {
            if (ownsCurrentState) {
                clearSplashDialog()
            }
        }
    }

    private fun clearSplashDialog() {
        if (displayMode == DisplayMode.SYSTEM) return

        cancelSplashAnimation()
        splashDialog = null
        splashContentView = null
        activityRef = null
        displayMode = null
        unregisterActivityLifecycleCallbacks()
        recordHidden()
    }

    private fun clearSystemSplash() {
        if (displayMode != DisplayMode.SYSTEM) return

        systemSplashVisible = false
        systemSplashGeneration++
        activityRef = null
        displayMode = null
        unregisterActivityLifecycleCallbacks()
        recordHidden()
    }

    private fun cancelSplashAnimation() {
        splashContentView?.animate()?.apply {
            withEndAction(null)
            setListener(null)
            cancel()
        }
    }

    private fun resetSplashContentView() {
        cancelSplashAnimation()
        splashContentView?.apply {
            alpha = 1f
            scaleX = 1f
            scaleY = 1f
            translationY = 0f
        }
    }

    private fun supportsAnimation(animation: String): Boolean =
        animation == "fade" ||
            animation == "scaleFade" ||
            animation == "slideUpFade" ||
            animation == "zoomOutFade"

    private fun safeScaleTarget(scale: Float, animation: String): Float {
        val finiteScale = scale.takeUnless { it.isNaN() || it.isInfinite() }
        return if (animation == "zoomOutFade") {
            finiteScale?.coerceIn(MIN_ZOOM_OUT_FADE_TARGET, MAX_ZOOM_OUT_FADE_TARGET)
                ?: DEFAULT_ZOOM_OUT_FADE_TARGET
        } else {
            finiteScale?.coerceIn(MIN_SCALE_FADE_TARGET, MAX_SCALE_FADE_TARGET)
                ?: DEFAULT_SCALE_FADE_TARGET
        }
    }

    private fun interpolatorFor(easing: String) = when (easing) {
        "linear" -> LinearInterpolator()
        "easeIn" -> AccelerateInterpolator()
        "easeInOut" -> AccelerateDecelerateInterpolator()
        else -> DecelerateInterpolator()
    }

    private fun areAnimationsEnabled(activity: Activity): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return ValueAnimator.areAnimatorsEnabled()
        }

        return try {
            Settings.Global.getFloat(
                activity.contentResolver,
                Settings.Global.ANIMATOR_DURATION_SCALE,
                1f
            ) != 0f
        } catch (_: RuntimeException) {
            true
        }
    }

    private fun registerActivityLifecycleCallbacks(activity: Activity) {
        val application = activity.application
        if (lifecycleApplication === application) return

        unregisterActivityLifecycleCallbacks()
        application.registerActivityLifecycleCallbacks(activityLifecycleCallbacks)
        lifecycleApplication = application
    }

    private fun unregisterActivityLifecycleCallbacks() {
        lifecycleApplication?.unregisterActivityLifecycleCallbacks(activityLifecycleCallbacks)
        lifecycleApplication = null
    }

    private fun recordShow() {
        synchronized(metricsLock) {
            showTime = monotonicTimeMs()
            hideRequestedTime = null
            hiddenTime = null
        }
    }

    private fun recordHideRequested() {
        synchronized(metricsLock) {
            if (showTime != null && hideRequestedTime == null && hiddenTime == null) {
                hideRequestedTime = monotonicTimeMs()
            }
        }
    }

    private fun recordHidden() {
        synchronized(metricsLock) {
            if (showTime != null && hiddenTime == null) {
                hiddenTime = monotonicTimeMs()
            }
        }
    }

    private fun durationBetween(start: Double?, end: Double?): Double? {
        if (start == null || end == null) return null
        return (end - start).coerceAtLeast(0.0)
    }

    private fun monotonicTimeMs(): Double = SystemClock.uptimeMillis().toDouble()

    private fun setActivityAndroidP(dialog: Dialog) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            dialog.window?.let { window ->
                window.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
                val layoutParams = window.attributes
                layoutParams.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
                window.attributes = layoutParams
            }
        }
    }
}
