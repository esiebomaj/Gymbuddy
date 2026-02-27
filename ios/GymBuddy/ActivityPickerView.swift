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
  @State private var selection = FamilyActivitySelection()
  var onDismiss: (Int) -> Void

  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Select Apps")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .confirmationAction) {
            Button("Done") {
              // Store the selected application tokens globally so
              // ScreenTimeManager.lockApps() can read them.
              ScreenTimeManager.selectedApps = selection.applicationTokens
              onDismiss(selection.applicationTokens.count)

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
