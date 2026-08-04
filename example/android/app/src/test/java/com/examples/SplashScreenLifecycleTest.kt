package com.examples

import android.app.Activity
import android.app.Application
import android.app.Dialog
import android.os.Looper
import com.tomwq.rnsplashscreen.SplashScreen
import java.util.concurrent.TimeUnit
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config
import org.robolectric.annotation.LooperMode
import org.robolectric.shadows.ShadowDialog

@RunWith(RobolectricTestRunner::class)
@Config(application = SplashScreenTestApplication::class, sdk = [35])
@LooperMode(LooperMode.Mode.PAUSED)
class SplashScreenLifecycleTest {
    private val controllers = mutableListOf<ActivityController<TestActivity>>()
    private var systemController: ActivityController<SystemSplashActivity>? = null

    @After
    fun tearDown() {
        SplashScreen.hide(null)
        shadowOf(Looper.getMainLooper()).idle()
        controllers.asReversed().forEach { controller ->
            if (!controller.get().isDestroyed) {
                controller.pause().stop().destroy()
            }
        }
        systemController?.let { controller ->
            if (!controller.get().isDestroyed) {
                controller.pause().stop().destroy()
            }
        }
        systemController = null
        shadowOf(Looper.getMainLooper()).idle()
    }

    @Test
    fun showAndHideManageDialogVisibility() {
        val activity = createActivity()

        SplashScreen.show(activity, false)
        idleMainLooper()
        val dialog = latestDialog()
        assertTrue(dialog.isShowing)

        SplashScreen.hide(activity)
        idleMainLooper()
        assertFalse(dialog.isShowing)
    }

    @Test
    fun destroyingOwningActivityDismissesDialog() {
        val controller = createActivityController()
        SplashScreen.show(controller.get(), false)
        idleMainLooper()
        val dialog = latestDialog()

        controller.pause().stop().destroy()
        idleMainLooper()

        assertFalse(dialog.isShowing)
    }

    @Test
    fun destroyingOldActivityDoesNotDismissReplacementDialog() {
        val oldController = createActivityController()
        SplashScreen.show(oldController.get(), false)
        idleMainLooper()
        val oldDialog = latestDialog()

        val newController = createActivityController()
        SplashScreen.show(newController.get(), false)
        idleMainLooper()
        val newDialog = latestDialog()

        assertFalse(oldDialog.isShowing)
        assertTrue(newDialog.isShowing)

        oldController.pause().stop().destroy()
        idleMainLooper()
        assertTrue(newDialog.isShowing)

        newController.pause().stop().destroy()
        idleMainLooper()
        assertFalse(newDialog.isShowing)
    }

    @Test
    fun showCancelsAnInFlightHideAnimation() {
        val activity = createActivity()
        SplashScreen.show(activity, false)
        idleMainLooper()
        val dialog = latestDialog()

        SplashScreen.hide(activity, "scaleFade", 500, 1.2f)
        SplashScreen.show(activity, false)
        idleMainLooper(1_000)

        assertSame(dialog, latestDialog())
        assertTrue(dialog.isShowing)
    }

    @Test
    fun startupMetricsTrackNativeVisibilityAndHideWork() {
        val activity = createActivity()

        SplashScreen.show(activity, false)
        idleMainLooper()
        val visibleMetrics = SplashScreen.getStartupMetrics()
        assertTrue(visibleMetrics["showTime"] != null)
        assertTrue(visibleMetrics["hideRequestedTime"] == null)
        assertTrue(visibleMetrics["hiddenTime"] == null)

        SplashScreen.hide(activity)
        idleMainLooper()
        val hiddenMetrics = SplashScreen.getStartupMetrics()
        assertTrue(hiddenMetrics["hideRequestedTime"] != null)
        assertTrue(hiddenMetrics["hiddenTime"] != null)
        assertTrue(checkNotNull(hiddenMetrics["nativeVisibleDuration"]) >= 0)
        assertTrue(checkNotNull(hiddenMetrics["hideDuration"]) >= 0)

        idleMainLooper(25)
        SplashScreen.hide(activity)
        idleMainLooper()
        val repeatedHideMetrics = SplashScreen.getStartupMetrics()
        assertEquals(hiddenMetrics["hideRequestedTime"], repeatedHideMetrics["hideRequestedTime"])
        assertEquals(hiddenMetrics["hiddenTime"], repeatedHideMetrics["hiddenTime"])
    }

    @Test
    fun systemModeKeepsTheSystemSplashWithoutCreatingADialog() {
        val shownDialogsBefore = ShadowDialog.getShownDialogs().size
        systemController = Robolectric.buildActivity(SystemSplashActivity::class.java)
        systemController!!.setup()
        idleMainLooper()

        assertEquals(shownDialogsBefore, ShadowDialog.getShownDialogs().size)
        assertTrue(SplashScreen.getStartupMetrics()["showTime"] != null)

        SplashScreen.hide(systemController!!.get())
        idleMainLooper()
    }

    private fun createActivity(): TestActivity = createActivityController().get()

    private fun createActivityController(): ActivityController<TestActivity> =
        Robolectric.buildActivity(TestActivity::class.java).setup().also(controllers::add)

    private fun latestDialog(): Dialog =
        checkNotNull(ShadowDialog.getLatestDialog()) { "Expected a splash Dialog" }

    private fun idleMainLooper(milliseconds: Long = 0) {
        val shadowLooper = shadowOf(Looper.getMainLooper())
        if (milliseconds == 0L) {
            shadowLooper.idle()
        } else {
            shadowLooper.idleFor(milliseconds, TimeUnit.MILLISECONDS)
        }
    }

    class TestActivity : Activity()

    class SystemSplashActivity : Activity() {
        override fun onCreate(savedInstanceState: android.os.Bundle?) {
            SplashScreen.show(this, false, true)
            super.onCreate(savedInstanceState)
        }
    }
}

class SplashScreenTestApplication : Application()
