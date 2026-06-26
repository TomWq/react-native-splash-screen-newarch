package com.tomwq.rnsplashscreen

import android.app.Activity
import android.app.Dialog
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.NinePatchDrawable
import android.os.Build
import android.view.View
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import java.lang.ref.WeakReference

object SplashScreen {
    private const val DEFAULT_SCALE_FADE_TARGET = 1.08f
    private const val MIN_SCALE_FADE_TARGET = 1f
    private const val MAX_SCALE_FADE_TARGET = 1.3f
    private const val POST_SPLASH_SCREEN_THEME_META_DATA =
        "com.tomwq.rnsplashscreen.POST_SPLASH_SCREEN_THEME"
    private var splashDialog: Dialog? = null
    private var splashContentView: View? = null
    private var activityRef: WeakReference<Activity>? = null

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

            if (splashDialog?.isShowing == true) {
                val previousActivity = activityRef?.get()
                if (previousActivity === activity && isActivityActive(activity)) {
                    return@runOnUiThread
                }

                splashDialog?.let { dismissDialog(it) }
            }

            activityRef = WeakReference(activity)

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
                splashDialog = null
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
    fun show(activity: Activity?) {
        show(activity, false)
    }

    @JvmStatic
    fun hide(activity: Activity?) {
        hide(activity, "none", 0, DEFAULT_SCALE_FADE_TARGET)
    }

    @JvmStatic
    fun hide(activity: Activity?, animation: String, duration: Long) {
        hide(activity, animation, duration, DEFAULT_SCALE_FADE_TARGET)
    }

    @JvmStatic
    fun hide(activity: Activity?, animation: String, duration: Long, scale: Float) {
        val resolvedActivity = activity ?: activityRef?.get() ?: return
        resolvedActivity.runOnUiThread {
            val dialog = splashDialog
            if (dialog != null && dialog.isShowing) {
                if (!isActivityActive(resolvedActivity)) {
                    dismissDialog(dialog)
                    return@runOnUiThread
                }

                val contentView = splashContentView
                if ((animation == "fade" || animation == "scaleFade") &&
                    duration > 0 &&
                    contentView != null
                ) {
                    val animator = contentView.animate()
                        .alpha(0f)
                        .setDuration(duration)
                        .setInterpolator(DecelerateInterpolator())
                        .withEndAction {
                            dismissDialog(dialog)
                        }

                    if (animation == "scaleFade") {
                        val safeScale = scale
                            .takeUnless { it.isNaN() || it.isInfinite() }
                            ?.coerceIn(MIN_SCALE_FADE_TARGET, MAX_SCALE_FADE_TARGET)
                            ?: DEFAULT_SCALE_FADE_TARGET
                        animator
                            .scaleX(safeScale)
                            .scaleY(safeScale)
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

    private fun configureSplashWindow(dialog: Dialog) {
        dialog.window?.let { window ->
            window.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
            window.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
            window.setDimAmount(0f)
            window.setWindowAnimations(0)
        }
    }

    private fun isActivityActive(activity: Activity): Boolean {
        val isDestroyed =
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1 &&
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
        try {
            dialog.dismiss()
        } catch (_: RuntimeException) {
            // The owning Activity may already be gone; clearing references is enough here.
        } finally {
            clearSplashDialog()
        }
    }

    private fun clearSplashDialog() {
        splashDialog = null
        splashContentView = null
        activityRef = null
    }

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
