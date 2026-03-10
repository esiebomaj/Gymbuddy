import Foundation
import FamilyControls
import ManagedSettings
import SwiftUI

// ---------------------------------------------------------------------------
// ScreenTimeManager — React Native native module
//
// Wraps Apple's Screen Time APIs (FamilyControls + ManagedSettings) so that
// the JS layer can: request auth → pick apps → shield → unshield.
// ---------------------------------------------------------------------------

@objc(ScreenTimeManager)
class ScreenTimeManager: NSObject {

  private static let kSelectedApps = "STM_selectedApps"
  private static let kCurrentSelection = "STM_currentSelection"

  private let store = ManagedSettingsStore()

  // In-memory cache, kept in sync with UserDefaults via save/restore.
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
    UserDefaults.standard.set(data, forKey: kSelectedApps)
  }

  private static func persistCurrentSelection() {
    guard let data = try? JSONEncoder().encode(currentSelection) else { return }
    UserDefaults.standard.set(data, forKey: kCurrentSelection)
  }

  private static func restorePersistedState() {
    if let data = UserDefaults.standard.data(forKey: kSelectedApps),
       let apps = try? JSONDecoder().decode(Set<ApplicationToken>.self, from: data),
       !apps.isEmpty {
      // Bypass didSet to avoid a redundant write back
      selectedApps = apps
    }
    if let data = UserDefaults.standard.data(forKey: kCurrentSelection),
       let sel = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
      currentSelection = sel
    }
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
  @objc
  func checkAuthorizationStatus(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 16.0, *) {
      let status = AuthorizationCenter.shared.authorizationStatus
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
    } else {
      reject("UNSUPPORTED", "Screen Time requires iOS 16 or later.", nil)
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

  // Required: tell React Native this module needs the main queue for UI work.
  @objc
  static func requiresMainQueueSetup() -> Bool { return false }
}
