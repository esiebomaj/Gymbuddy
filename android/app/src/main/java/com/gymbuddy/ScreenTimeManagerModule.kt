package com.gymbuddy

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Android implementation of the same API as iOS ScreenTimeManager.
 * Uses an Accessibility Service to block selected apps (overlay when a blocked app is in foreground).
 * Authorization: user enables GymBuddy in Settings → Accessibility.
 */
class ScreenTimeManagerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    override fun getName(): String = "ScreenTimeManager"

    private val prefs: SharedPreferences =
        reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private var appPickerPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun invalidate() {
        reactContext.removeActivityEventListener(this)
        appPickerPromise = null
        super.invalidate()
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val context = reactApplicationContext
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.JELLY_BEAN_MR2) return false
        if (Settings.Secure.getInt(context.contentResolver, Settings.Secure.ACCESSIBILITY_ENABLED, 0) != 1) {
            return false
        }
        val enabledServices = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        val ourService = "${context.packageName}/${GymBuddyAccessibilityService::class.java.canonicalName}"
        return enabledServices.split(':').any { it.trim().equals(ourService, ignoreCase = true) }
    }

    private fun getSelectedPackages(): Set<String> =
        prefs.getStringSet(KEY_SELECTED_PACKAGES, null) ?: emptySet()

    private fun setSelectedPackages(packages: Set<String>) {
        prefs.edit().putStringSet(KEY_SELECTED_PACKAGES, packages).apply()
    }

    private fun getShieldedCount(): Int = prefs.getInt(KEY_SHIELDED_COUNT, 0)

    private fun setShieldedCount(count: Int) {
        prefs.edit().putInt(KEY_SHIELDED_COUNT, count).apply()
    }

    @ReactMethod
    fun checkAuthorizationStatus(resolve: Promise, reject: Promise) {
        if (isAccessibilityServiceEnabled()) {
            resolve.resolve("approved")
        } else {
            resolve.resolve("denied")
        }
    }

    @ReactMethod
    fun requestAuthorization(resolve: Promise, reject: Promise) {
        if (isAccessibilityServiceEnabled()) {
            resolve.resolve("authorized")
            return
        }
        openAccessibilitySettingsInternal()
        reject.reject(
            "ACCESSIBILITY_NOT_GRANTED",
            "To block apps on Android, enable GymBuddy in Settings → Accessibility."
        )
    }

    /** Opens the system Accessibility settings so the user can enable this app. Call from JS (e.g. "Open Settings" button). */
    @ReactMethod
    fun openAccessibilitySettings(resolve: Promise, reject: Promise) {
        try {
            openAccessibilitySettingsInternal()
            resolve.resolve(null)
        } catch (e: Exception) {
            reject.reject("ERROR", e.message ?: "Could not open Settings")
        }
    }

    private fun openAccessibilitySettingsInternal() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun getShieldedAppCount(resolve: Promise, reject: Promise) {
        resolve.resolve(getShieldedCount())
    }

    @ReactMethod
    fun getSelectedAppCount(resolve: Promise, reject: Promise) {
        resolve.resolve(getSelectedPackages().size)
    }

    @ReactMethod
    fun showAppPicker(resolve: Promise, reject: Promise) {
        val activity = currentActivity ?: run {
            reject.reject("NO_ACTIVITY", "No current activity")
            return
        }
        appPickerPromise = resolve
        val intent = Intent(reactApplicationContext, AppPickerActivity::class.java)
        activity.startActivityForResult(intent, REQUEST_APP_PICKER)
    }

    @ReactMethod
    fun lockApps(resolve: Promise, reject: Promise) {
        if (!isAccessibilityServiceEnabled()) {
            reject.reject("ACCESSIBILITY_NOT_GRANTED", "Enable GymBuddy in Settings → Accessibility first")
            return
        }
        val packages = getSelectedPackages()
        if (packages.isEmpty()) {
            reject.reject("NO_APPS", "No apps selected. Use the picker first.")
            return
        }
        setShieldedCount(packages.size)
        resolve.resolve("Locked ${packages.size} app(s)")
    }

    @ReactMethod
    fun unlockApps(resolve: Promise, reject: Promise) {
        setShieldedCount(0)
        resolve.resolve("All apps unlocked")
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == REQUEST_APP_PICKER) {
            val promise = appPickerPromise
            appPickerPromise = null
            if (resultCode == Activity.RESULT_OK && data != null) {
                val count = data.getIntExtra(AppPickerActivity.EXTRA_SELECTED_COUNT, 0)
                promise?.resolve(count)
            } else {
                promise?.resolve(0)
            }
        }
    }

    override fun onNewIntent(intent: Intent?) {}

    companion object {
        private const val PREFS_NAME = "ScreenTimeManager"
        private const val KEY_SELECTED_PACKAGES = "selected_packages"
        private const val KEY_SHIELDED_COUNT = "shielded_count"
        private const val REQUEST_APP_PICKER = 7001
    }
}
