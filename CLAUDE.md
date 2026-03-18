# NeuBridge Development Rules

## CRITICAL: DO NOT BREAK THE APP

These rules exist because the app has broken 4 times from the same cause.

### NEVER run these commands:
- npm install <anything>
- npm uninstall <anything>
- npx expo install <anything>
- yarn add/remove <anything>

### If you need a new package:
1. STOP and tell James what package you need and why
2. James or Claude Chat will manually edit package.json
3. Then run: npm run clean
4. That is it. No other way.

### If the app will not start:
1. Run: npm run reset
2. This does a nuclear clean and restarts fresh
3. If it STILL fails, fix the SCREEN FILE mentioned in the error
4. Do NOT touch package.json

### SDK Version:
- Expo SDK 55, React 19, React Native 0.83
- The "overrides" field in package.json is REQUIRED
- expo-av DOES NOT WORK in Expo Go. Do not add it.

### Screen file rules:
- Every .tsx file in app/ MUST have: export default function ScreenName() { ... }
- Missing default exports crash the entire app

### Git:
- Branch is master (not main)
