import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity
import UserNotifications
import SwiftUI

// ---------------------------------------------------------------------------
// ScreenTimeManager — React Native native module
//
// Wraps Apple's Screen Time APIs (FamilyControls + ManagedSettings +
// DeviceActivity) so that the JS layer can: request auth → pick apps →
// schedule a daily lock window. The actual shield/unshield at the scheduled
// boundaries is performed by GymBuddyDeviceActivityMonitor (extension target),
// which reads the same shared App Group UserDefaults.
// ---------------------------------------------------------------------------

@objc(ScreenTimeManager)
class ScreenTimeManager: NSObject {

  // Shared App Group keys — must match GymBuddyDeviceActivityMonitor.
  static let appGroupID = "group.com.dominiceburuoh.gymbuddy"
  static let kSelectedApps = "STM_selectedApps"
  static let kCurrentSelection = "STM_currentSelection"
  static let kGymDays = "STM_gymDays"
  static let kVisitedTodayDate = "STM_visitedTodayDate"
  static let activityName = DeviceActivityName("gymBuddyDailyLock")
  static let lockStartNotificationID = "gymbuddy.lock.start"

  static let sharedDefaults = UserDefaults(suiteName: appGroupID)!

  private let store = ManagedSettingsStore()

  // In-memory cache, kept in sync with shared UserDefaults via save/restore.
  static var selectedApps: Set<ApplicationToken> = [] {
    didSet { Self.persistSelectedApps() }
  }

  static var currentSelection = FamilyActivitySelection() {
    didSet { Self.persistCurrentSelection() }
  }

  override init() {
    super.init()
    Self.restorePersistedState()
  }

  // MARK: - Persistence helpers

  private static func persistSelectedApps() {
    guard let data = try? JSONEncoder().encode(selectedApps) else { return }
    sharedDefaults.set(data, forKey: kSelectedApps)
  }

  private static func persistCurrentSelection() {
    guard let data = try? JSONEncoder().encode(currentSelection) else { return }
    sharedDefaults.set(data, forKey: kCurrentSelection)
  }

  private static func restorePersistedState() {
    if let data = sharedDefaults.data(forKey: kSelectedApps),
       let apps = try? JSONDecoder().decode(Set<ApplicationToken>.self, from: data),
       !apps.isEmpty {
      selectedApps = apps
    }
    if let data = sharedDefaults.data(forKey: kCurrentSelection),
       let sel = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
      currentSelection = sel
    }
  }

  // ISO yyyy-MM-dd string for "today" in the user's calendar.
  static func todayDateString() -> String {
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.locale = Locale(identifier: "en_US_POSIX")
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: Date())
  }

  // MARK: - 1. Authorization
  // Requests the user (or guardian, for child accounts) to authorize this app
  // for Family Controls. This is a one-time prompt per device/account.
  @objc
  func requestAuthorization(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 16.0, *) {
      Task {
        do {
          try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
          resolve("authorized")
        } catch {
          // Error code 4 = restricted (missing entitlement or personal team)
          // Error code 5 = denied by user
          let nsError = error as NSError
          if nsError.code == 4 || nsError.code == 5 {
            reject("ENTITLEMENT_MISSING", "Screen Time requires an Apple Developer Program membership. Please sign up at developer.apple.com to enable app locking.", error)
          } else {
            reject("AUTH_ERROR", "Authorization failed: \(error.localizedDescription)", error)
          }
        }
      }
    } else {
      reject("UNSUPPORTED", "Screen Time app locking requires iOS 16 or later.", nil)
    }
  }

  // MARK: - 1b. Check existing authorization
  // On cold launch (especially after the app has been killed for a long time)
  // AuthorizationCenter.shared.authorizationStatus can transiently return
  // .notDetermined before the FamilyControls daemon finishes loading. Retry
  // briefly so JS doesn't see a stale "unauthorized" state.
  @objc
  func checkAuthorizationStatus(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.0, *) else {
      reject("UNSUPPORTED", "Screen Time requires iOS 16 or later.", nil)
      return
    }

    Task {
      let center = AuthorizationCenter.shared
      var status = center.authorizationStatus

      // Retry up to ~1s total if the daemon hasn't reported a definitive
      // status yet. Bail out as soon as we see approved/denied.
      var attempts = 0
      while status == .notDetermined && attempts < 5 {
        try? await Task.sleep(nanoseconds: 200_000_000) // 200ms
        status = center.authorizationStatus
        attempts += 1
      }

      switch status {
      case .approved:
        resolve("approved")
      case .denied:
        resolve("denied")
      case .notDetermined:
        resolve("notDetermined")
      @unknown default:
        resolve("notDetermined")
      }
    }
  }

  // MARK: - 1c. Check how many apps are currently shielded
  // ManagedSettingsStore persists across app launches, so we can read it back.
  @objc
  func getShieldedAppCount(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let count = store.shield.applications?.count ?? 0
    if count > 0, let tokens = store.shield.applications {
      ScreenTimeManager.selectedApps = tokens
    }
    resolve(count)
  }

  // MARK: - 1d. Return count of persisted app selection (survives unlock + relaunch)
  @objc
  func getSelectedAppCount(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(ScreenTimeManager.selectedApps.count)
  }

  // MARK: - 2. Present the FamilyActivityPicker
  // Shows a SwiftUI FamilyActivityPicker hosted inside a UIHostingController.
  // The picker lets the user select which apps to restrict. Selected tokens
  // are stored in ScreenTimeManager.selectedApps.
  @objc
  func showAppPicker(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let rootVC = UIApplication.shared.connectedScenes
        .compactMap({ $0 as? UIWindowScene })
        .flatMap({ $0.windows })
        .first(where: { $0.isKeyWindow })?.rootViewController else {
        reject("NO_ROOT_VC", "Could not find root view controller", nil)
        return
      }

      let pickerView = ActivityPickerView(previousSelection: ScreenTimeManager.currentSelection, onDismiss: { count in
        resolve(count)
      })
      let hostingController = UIHostingController(rootView: pickerView)
      hostingController.modalPresentationStyle = .formSheet
      rootVC.present(hostingController, animated: true)
    }
  }

  // MARK: - 3. Shield (lock) the selected apps
  // Applies a ManagedSettings shield to every app the user picked.
  // Once shielded, the OS overlays a blocking screen on those apps — they
  // cannot be opened until the shield is removed.
  @objc
  func lockApps(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let tokens = ScreenTimeManager.selectedApps
    guard !tokens.isEmpty else {
      reject("NO_APPS", "No apps selected. Use the picker first.", nil)
      return
    }

    // Apply the shield: this is the key line that locks apps.
    store.shield.applications = tokens
    resolve("Locked \(tokens.count) app(s)")
  }

  // MARK: - 4. Unshield (unlock) — simulates "gym check-in"
  // Clears all shields from the ManagedSettingsStore, instantly unblocking
  // every previously shielded app. In a real app you'd gate this behind
  // actual location / QR / NFC verification.
  @objc
  func unlockApps(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    // Clearing the store removes every restriction this app has applied.
    store.clearAllSettings()
    resolve("All apps unlocked")
  }

  // MARK: - 5. Schedule the daily lock window
  // Registers a DeviceActivitySchedule with the OS so that the
  // GymBuddyDeviceActivityMonitor extension is woken at the start/end of
  // every lock window — even if the app is closed. Also schedules a local
  // notification at the start of each gym day's window.
  //
  // params: { gymDays: [Int] (0..6, Sun=0), startHour, startMinute, endHour, endMinute }
  @objc
  func scheduleLockWindow(
    _ params: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.0, *) else {
      reject("UNSUPPORTED", "Screen Time scheduling requires iOS 16 or later.", nil)
      return
    }

    // RN bridges JS numbers as NSNumber; coerce defensively rather than
    // relying on `as? Int` / `as? [Int]` which can fail silently for arrays.
    guard
      let gymDaysRaw = params["gymDays"] as? [Any],
      let startHour = (params["startHour"] as? NSNumber)?.intValue,
      let startMinute = (params["startMinute"] as? NSNumber)?.intValue,
      let endHour = (params["endHour"] as? NSNumber)?.intValue,
      let endMinute = (params["endMinute"] as? NSNumber)?.intValue
    else {
      reject("BAD_PARAMS", "scheduleLockWindow requires gymDays:[Int], startHour, startMinute, endHour, endMinute. Got: \(params)", nil)
      return
    }
    let gymDays: [Int] = gymDaysRaw.compactMap { ($0 as? NSNumber)?.intValue }
    guard !gymDays.isEmpty else {
      reject("BAD_PARAMS", "gymDays must be a non-empty array of integers (0..6, Sun=0). Got: \(gymDaysRaw)", nil)
      return
    }

    Self.sharedDefaults.set(gymDays, forKey: Self.kGymDays)
    NSLog("[ScreenTimeManager] scheduleLockWindow gymDays=\(gymDays) start=\(startHour):\(startMinute) end=\(endHour):\(endMinute)")

    let schedule = DeviceActivitySchedule(
      intervalStart: DateComponents(hour: startHour, minute: startMinute),
      intervalEnd:   DateComponents(hour: endHour,   minute: endMinute),
      repeats: true
    )

    let center = DeviceActivityCenter()
    center.stopMonitoring([Self.activityName])
    do {
      try center.startMonitoring(Self.activityName, during: schedule)
      NSLog("[ScreenTimeManager] startMonitoring succeeded for \(Self.activityName.rawValue)")
    } catch {
      NSLog("[ScreenTimeManager] startMonitoring failed: \(error.localizedDescription)")
      reject("SCHEDULE_FAILED", "startMonitoring failed: \(error.localizedDescription)", error)
      return
    }

    Self.scheduleLockStartNotification(
      gymDays: gymDays,
      hour: startHour,
      minute: startMinute
    )

    resolve(nil)
  }

  // MARK: - Diagnostics
  // Returns whether the gymBuddyDailyLock activity is currently registered
  // with the OS, plus the persisted gymDays / visited flag and the count of
  // selected/shielded apps. Lets JS verify end-to-end setup without a debugger.
  @objc
  func getScheduleDebugInfo(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.0, *) else {
      resolve(["supported": false])
      return
    }
    let center = DeviceActivityCenter()
    let activities = center.activities.map { $0.rawValue }
    let isMonitoring = activities.contains(Self.activityName.rawValue)
    let gymDays = Self.sharedDefaults.array(forKey: Self.kGymDays) as? [Int] ?? []
    let visitedToday = Self.sharedDefaults.string(forKey: Self.kVisitedTodayDate) ?? ""
    resolve([
      "supported": true,
      "isMonitoring": isMonitoring,
      "activities": activities,
      "gymDays": gymDays,
      "visitedTodayDate": visitedToday,
      "selectedAppCount": Self.selectedApps.count,
      "shieldedAppCount": store.shield.applications?.count ?? 0,
      "today": Self.todayDateString(),
    ])
  }

  @objc
  func clearScheduledLockWindow(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.0, *) else {
      resolve(nil)
      return
    }
    DeviceActivityCenter().stopMonitoring([Self.activityName])
    Self.cancelLockStartNotification()
    resolve(nil)
  }

  // MARK: - 6. Visited-today flag
  // The DeviceActivityMonitor extension reads this flag at intervalDidStart
  // to decide whether to apply the shield. JS calls markVisitedToday() right
  // after submitProof + unlockApps so the next interval start (e.g. tomorrow)
  // does not pre-emptively re-shield today's apps if the user already worked
  // out before the window began.
  @objc
  func markVisitedToday(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Self.sharedDefaults.set(Self.todayDateString(), forKey: Self.kVisitedTodayDate)
    resolve(nil)
  }

  @objc
  func clearVisitedToday(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Self.sharedDefaults.removeObject(forKey: Self.kVisitedTodayDate)
    resolve(nil)
  }

  // MARK: - 7. Local notification at lock-start (Option D, UX cue only)

  private static func scheduleLockStartNotification(gymDays: [Int], hour: Int, minute: Int) {
    let center = UNUserNotificationCenter.current()

    // Best-effort permission request; lock still works if denied.
    center.requestAuthorization(options: [.alert, .sound]) { _, _ in }

    cancelLockStartNotification()

    let content = UNMutableNotificationContent()
    content.title = "Apps locked"
    content.body = "Your apps are locked. Hit the gym to unlock them."
    content.sound = .default

    // gymDays uses JS Date.getDay() convention: 0=Sun..6=Sat.
    // UNCalendarNotificationTrigger uses Calendar.weekday: 1=Sun..7=Sat.
    for jsDay in gymDays {
      var components = DateComponents()
      components.weekday = jsDay + 1
      components.hour = hour
      components.minute = minute

      let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
      let request = UNNotificationRequest(
        identifier: "\(lockStartNotificationID).\(jsDay)",
        content: content,
        trigger: trigger
      )
      center.add(request) { _ in }
    }
  }

  private static func cancelLockStartNotification() {
    let ids = (0...6).map { "\(lockStartNotificationID).\($0)" }
    UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ids)
  }

  // Required: tell React Native this module needs the main queue for UI work.
  @objc
  static func requiresMainQueueSetup() -> Bool { return false }
}
