import DeviceActivity
import ManagedSettings
import FamilyControls
import Foundation

// ---------------------------------------------------------------------------
// DeviceActivityMonitorExtension
//
// Awoken by iOS at the start and end of every gymBuddyDailyLock interval
// scheduled by the main app via DeviceActivityCenter. Reads the user's
// selected app tokens, gym-day filter, and visited-today flag from the
// shared App Group UserDefaults, then applies or clears the shield on the
// shared ManagedSettingsStore. Runs even when the host app is closed.
// ---------------------------------------------------------------------------

class DeviceActivityMonitorExtension: DeviceActivityMonitor {

  private static let appGroupID = "group.com.dominiceburuoh.gymbuddy"
  private static let kSelectedApps = "STM_selectedApps"
  private static let kGymDays = "STM_gymDays"
  private static let kVisitedTodayDate = "STM_visitedTodayDate"

  private let store = ManagedSettingsStore()
  private let defaults = UserDefaults(suiteName: appGroupID)!

  override func intervalDidStart(for activity: DeviceActivityName) {
    super.intervalDidStart(for: activity)
    NSLog("[GymBuddyMonitor] intervalDidStart \(activity.rawValue)")
    guard shouldLockToday() else {
      NSLog("[GymBuddyMonitor] skip: not a gym day or already visited today")
      return
    }
    guard let tokens = loadSelectedApps(), !tokens.isEmpty else {
      NSLog("[GymBuddyMonitor] skip: no selected apps in shared defaults")
      return
    }
    NSLog("[GymBuddyMonitor] applying shield to \(tokens.count) apps")
    store.shield.applications = tokens
  }

  override func intervalDidEnd(for activity: DeviceActivityName) {
    super.intervalDidEnd(for: activity)
    NSLog("[GymBuddyMonitor] intervalDidEnd \(activity.rawValue) — clearing shield")
    store.clearAllSettings()
  }

  // MARK: - Helpers

  private func loadSelectedApps() -> Set<ApplicationToken>? {
    guard let data = defaults.data(forKey: Self.kSelectedApps) else { return nil }
    return try? JSONDecoder().decode(Set<ApplicationToken>.self, from: data)
  }

  // gymDays uses JS Date.getDay() convention: 0=Sun..6=Sat.
  // Calendar.weekday is 1=Sun..7=Sat, so subtract 1 to compare.
  private func shouldLockToday() -> Bool {
    let gymDays = defaults.array(forKey: Self.kGymDays) as? [Int] ?? []
    let todayJS = Calendar.current.component(.weekday, from: Date()) - 1
    if !gymDays.contains(todayJS) { return false }

    if let visited = defaults.string(forKey: Self.kVisitedTodayDate),
       visited == Self.todayDateString() {
      return false
    }
    return true
  }

  private static func todayDateString() -> String {
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.locale = Locale(identifier: "en_US_POSIX")
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: Date())
  }
}
