# GymBuddy — Screen Time Shielding MVP

Minimal React Native (bare CLI) iOS app that demonstrates locking/unlocking apps using Apple's Screen Time APIs (FamilyControls + ManagedSettings).

## What it does

1. **Request Authorization** — asks the user for Family Controls permission
2. **Select Apps to Lock** — presents Apple's `FamilyActivityPicker`
3. **Lock Selected Apps** — applies a ManagedSettings shield to chosen apps
4. **Simulate Gym Check-In (Unlock)** — removes all shields

---

## Project structure

```
App.tsx                              ← React Native UI (4 buttons + status)
ios/GymBuddy/
  ScreenTimeManager.swift            ← Native module: auth, lock, unlock
  ActivityPickerView.swift           ← SwiftUI FamilyActivityPicker wrapper
  ScreenTimeManagerBridge.m          ← ObjC bridge (exposes Swift to RN)
  GymBuddy-Bridging-Header.h        ← Bridging header (exposes RN ObjC to Swift)
  GymBuddy.entitlements              ← Family Controls entitlement
```

---

## Setup instructions

### 1. Prerequisites

- **Xcode 15+** (with iOS 16+ SDK)
- **Physical iPhone** running **iOS 16+** (Screen Time APIs don't work on Simulator)
- **Apple Developer account** (free or paid)
- Node.js 18+, Ruby (with Bundler), CocoaPods

### 2. Install dependencies

```bash
npm install
cd ios && bundle exec pod install && cd ..
```

### 3. Enable Family Controls capability

#### In Apple Developer Portal

1. Go to https://developer.apple.com/account/resources/identifiers
2. Find or create your App ID (bundle ID: `org.reactjs.native.example.GymBuddy` or change it)
3. Under **Capabilities**, enable **Family Controls**
4. Save and regenerate your provisioning profile

#### In Xcode

1. Open `ios/GymBuddy.xcworkspace`
2. Select the **GymBuddy** target → **Signing & Capabilities**
3. Set your **Team** and **Bundle Identifier**
4. Click **+ Capability** → add **Family Controls**
   - The entitlements file is already configured — Xcode should recognize it

### 4. Info.plist

No special Info.plist keys are required for FamilyControls. The authorization prompt is system-managed.

### 5. Minimum iOS version

The project is set to **iOS 16.0**. The `FamilyActivityPicker` and `ManagedSettings` APIs require iOS 16+.

### 6. Run on physical device

Screen Time APIs **do not work on the Simulator**. You must run on a real device:

```bash
# Start Metro bundler
npx react-native start

# In another terminal — build and run on device
npx react-native run-ios --device
```

Or open `ios/GymBuddy.xcworkspace` in Xcode, select your physical device, and hit Run.

### 7. Testing the flow

1. Tap **Request Authorization** — approve the Screen Time prompt
2. Tap **Select Apps to Lock** — pick one or more apps from the picker, tap **Done**
3. Tap **Lock Selected Apps** — the selected apps are now shielded (try opening them!)
4. Tap **Simulate Gym Check-In (Unlock)** — shields are removed

---

## Important notes

- The `FamilyControls` entitlement requires approval from Apple for App Store distribution. For development/testing it works with a development provisioning profile.
- App tokens are opaque — you cannot see bundle IDs. This is by design for privacy.
- `ManagedSettingsStore.clearAllSettings()` removes all restrictions applied by this app.
- No persistence — selections are lost when the app is killed.
