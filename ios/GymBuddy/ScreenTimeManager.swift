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

  // ManagedSettings uses a "store" to apply restrictions.
  // The default .main store is per-app and doesn't need App Groups.
  private let store = ManagedSettingsStore()

  // Holds the set of application tokens the user picked via FamilyActivityPicker.
  // Tokens are opaque — they don't expose bundle IDs, only the system can resolve them.
  static var selectedApps: Set<ApplicationToken> = []

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
          reject("AUTH_ERROR", "Authorization failed: \(error.localizedDescription)", error)
        }
      }
    } else {
      reject("UNSUPPORTED", "iOS 16+ required", nil)
    }
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

      let pickerView = ActivityPickerView(onDismiss: { count in
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
