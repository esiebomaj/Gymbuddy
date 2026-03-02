import SwiftUI
import FamilyControls

// ---------------------------------------------------------------------------
// ActivityPickerView — SwiftUI wrapper for FamilyActivityPicker
//
// FamilyActivityPicker is a SwiftUI-only component provided by Apple.
// We host it inside a UIHostingController (presented by ScreenTimeManager)
// so it can be triggered from React Native.
//
// When the user finishes picking apps, we:
//  1. Store the selected tokens in ScreenTimeManager.selectedApps
//  2. Call onDismiss with the count of selected apps
//  3. Dismiss the hosting controller
// ---------------------------------------------------------------------------

struct ActivityPickerView: View {
  @State private var selection: FamilyActivitySelection
  // The selection that was active when the picker was opened.
  // On Done we union the new selection with this so that previously
  // locked apps are never accidentally removed.
  private let previousSelection: FamilyActivitySelection
  var onDismiss: (Int) -> Void

  init(previousSelection: FamilyActivitySelection, onDismiss: @escaping (Int) -> Void) {
    self.previousSelection = previousSelection
    self.onDismiss = onDismiss
    // Pre-populate the picker — user sees their existing locked apps already
    // checked and can simply add more on top.
    _selection = State(initialValue: previousSelection)
  }

  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Select Apps")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .confirmationAction) {
            Button("Done") {
              // Union new picks with previous so old locks are always preserved.
              let combinedTokens = selection.applicationTokens
                .union(previousSelection.applicationTokens)
              ScreenTimeManager.selectedApps = combinedTokens

              // Persist the merged selection so the next picker open is
              // also pre-populated correctly.
              var saved = FamilyActivitySelection()
              saved.applicationTokens = combinedTokens
              ScreenTimeManager.currentSelection = saved

              onDismiss(combinedTokens.count)

              // Dismiss the UIHostingController that presents this view.
              if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                 let root = scene.windows.first?.rootViewController {
                root.dismiss(animated: true)
              }
            }
          }
        }
    }
  }
}
