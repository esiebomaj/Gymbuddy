package com.gymbuddy

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/**
 * Activity that lists installed launchable apps and lets the user select which to lock.
 * Saves selection to SharedPreferences (same keys as ScreenTimeManagerModule) and
 * returns the selected count to the caller.
 */
class AppPickerActivity : Activity() {

    private val prefs by lazy { getSharedPreferences(PREFS_NAME, MODE_PRIVATE) }

    private val keySelectedPackages = "selected_packages"

    private val selectedPackages = mutableSetOf<String>()
    private val checkboxes = mutableListOf<CheckBox>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val scroll = ScrollView(this)
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
        }

        val title = TextView(this).apply {
            text = "Select apps to lock when you haven't visited the gym"
            setPadding(0, 0, 0, 24)
            textSize = 18f
        }
        layout.addView(title)

        val pm = packageManager
        val launchable = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            pm.getInstalledApplications(PackageManager.MATCH_UNINSTALLED_PACKAGES)
        } else {
            @Suppress("DEPRECATION")
            pm.getInstalledApplications(PackageManager.GET_META_DATA)
        }.filter { info ->
            val launchIntent = pm.getLaunchIntentForPackage(info.packageName)
            launchIntent != null && info.packageName != packageName
        }.sortedBy { it.loadLabel(pm).toString().lowercase() }

        val loaded = prefs.getStringSet(keySelectedPackages, null) ?: emptySet()
        selectedPackages.addAll(loaded)

        for (info in launchable) {
            val label = info.loadLabel(pm).toString()
            val pkg = info.packageName
            val check = CheckBox(this).apply {
                text = label
                isChecked = selectedPackages.contains(pkg)
                setOnCheckedChangeListener { _, isChecked ->
                    if (isChecked) selectedPackages.add(pkg) else selectedPackages.remove(pkg)
                }
            }
            checkboxes.add(check)
            layout.addView(check)
        }

        val done = Button(this).apply {
            text = "Done"
            setOnClickListener { onDone() }
        }
        layout.addView(done)

        scroll.addView(layout)
        setContentView(scroll)
    }

    private fun onDone() {
        prefs.edit().putStringSet(keySelectedPackages, HashSet(selectedPackages)).apply()
        setResult(RESULT_OK, Intent().putExtra(EXTRA_SELECTED_COUNT, selectedPackages.size))
        finish()
    }

    companion object {
        const val EXTRA_SELECTED_COUNT = "selected_count"
        private const val PREFS_NAME = "ScreenTimeManager"
    }
}
