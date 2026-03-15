package com.gymbuddy

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.PixelFormat
import android.os.Build
import android.provider.Settings
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import android.view.accessibility.AccessibilityEvent

/**
 * Accessibility Service that helps the user stay focused by blocking selected apps
 * until they log a gym visit. When lock is active and the user opens a blocked app,
 * a full-screen overlay is shown. We only use the current app package name to decide
 * whether to show the block overlay; we do not read or log app content.
 */
class GymBuddyAccessibilityService : AccessibilityService() {

    private val prefs: SharedPreferences by lazy {
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    private var overlayView: View? = null
    private var windowManager: WindowManager? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val pkg = event.packageName?.toString() ?: return
        if (pkg == packageName) {
            // User is in GymBuddy; remove overlay if showing
            removeOverlay()
            return
        }

        val lockActive = prefs.getInt(KEY_SHIELDED_COUNT, 0) > 0
        val blockedPackages = prefs.getStringSet(KEY_SELECTED_PACKAGES, null) ?: emptySet<String>()

        if (lockActive && blockedPackages.contains(pkg)) {
            showOverlay()
        } else {
            removeOverlay()
        }
    }

    override fun onInterrupt() {
        removeOverlay()
    }

    override fun onDestroy() {
        removeOverlay()
        super.onDestroy()
    }

    private fun showOverlay() {
        if (overlayView != null) return
        val wm = windowManager ?: return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!Settings.canDrawOverlays(this)) {
                // Overlay permission not granted; service can still run but overlay may fail.
                // requestAuthorization in the app should prompt for overlay permission.
                return
            }
        }

        val layoutParams = WindowManager.LayoutParams().apply {
            type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            }
            flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
            format = PixelFormat.TRANSLUCENT
            width = WindowManager.LayoutParams.MATCH_PARENT
            height = WindowManager.LayoutParams.MATCH_PARENT
            gravity = Gravity.TOP or Gravity.START
            x = 0
            y = 0
        }

        val view = LayoutInflater.from(this).inflate(R.layout.overlay_blocked_app, null).apply {
            findViewById<TextView>(R.id.overlay_message).text =
                getString(R.string.overlay_blocked_message)
            findViewById<Button>(R.id.overlay_open_gymbuddy).setOnClickListener {
                removeOverlay()
                startActivity(Intent(this@GymBuddyAccessibilityService, MainActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            }
        }

        try {
            wm.addView(view, layoutParams)
            overlayView = view
        } catch (_: Exception) {
            // Overlay permission may be denied on some devices
        }
    }

    private fun removeOverlay() {
        val wm = windowManager ?: return
        overlayView?.let { view ->
            try {
                wm.removeView(view)
            } catch (_: Exception) { }
            overlayView = null
        }
    }

    companion object {
        private const val PREFS_NAME = "ScreenTimeManager"
        private const val KEY_SELECTED_PACKAGES = "selected_packages"
        private const val KEY_SHIELDED_COUNT = "shielded_count"
    }
}
