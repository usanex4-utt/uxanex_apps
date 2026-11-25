
# Two Hearts, One Love ❤️

A romantic interactive feature for UtaNexa Couple Chat.

Two partners select separate Crystal Hearts, confirm their readiness, watch a synchronized countdown, and witness a unique Surprise Crystal Heart Fusion.

## 1. Feature Overview

- Crystal Heart selection for both partners.
- Romantic animated background with floating hearts and rain.
- Both partners must independently press Start.
- Synchronized countdown: 3, 2, 1.
- Unique Surprise Crystal Heart Fusion.
- Same fusion result displayed to both partners.
- Independent 3-star ratings.
- Completion message: "अब आगे बातें करो ❤️".
- Return to normal Couple Chat after both ratings.

## 2. Folder Structure

```text
two-hearts-one-love/
│
├── README.md
├── index.js
├── TwoHeartsOneLoveScreen.js
├── CrystalHeart.js
├── HeartSelectionScreen.js
├── HeartFusionAnimation.js
├── HeartbeatSound.js
├── RatingScreen.js
├── RomanticBackground.js
└── SurpriseHeartGenerator.js
```

## 3. Installation Requirements

The main UtaNexa project already uses these dependencies:

- React Native
- Expo SDK 51
- react-native-reanimated
- expo-av
- expo-linear-gradient

The current feature uses React Native Animated for its animations.

Heartbeat audio is temporarily disabled because audio assets have not been added.

## 4. Import Components

```jsx
import {
  TwoHeartsOneLoveScreen,
  CrystalHeart,
  HeartFusionAnimation,
  HeartbeatSound,
  RatingScreen,
  HeartSelectionScreen,
  RomanticBackground,
} from './src/features/two-hearts-one-love';
```

The SurpriseHeartGenerator can be imported directly:

```jsx
import generateSurpriseHeart from
  './src/features/two-hearts-one-love/SurpriseHeartGenerator';
```

## 5. Screen Props

TwoHeartsOneLoveScreen accepts:

| Prop | Purpose |
|---|---|
| phase | Current feature phase |
| myStarted | Current user's readiness |
| partnerStarted | Partner's readiness |
| countdown | Shared countdown value |
| onStart | Start confirmation callback |
| onRatingSubmit | Rating submission callback |
| firstHeart | First selected Crystal Heart |
| secondHeart | Second selected Crystal Heart |
| fusionSeed | Shared server-generated fusion seed |
| backgroundSeed | Shared background theme seed |
| heartData | Server-provided final Surprise Heart |
| onFusionComplete | Fusion animation completion callback |

## 6. Supported Phases

- `waiting`
- `countdown`
- `fusion`
- `rating`
- `completed`

The parent integration must control phase transitions.

## 7. Heart Selection

HeartSelectionScreen displays 12 selectable Crystal Hearts.

Example:

```jsx
<HeartSelectionScreen
  title="Choose Your Crystal Heart ❤️"
  onSelect={(heart) => {
    // Send selected heart to backend
  }}
/>
```

## 8. Surprise Crystal Heart Fusion

The generator supports seeded random generation.

Both partners must receive the same fusion seed and the same selected heart data.

The backend must create and persist the authoritative fusion result.

A locally generated fallback must not be treated as synchronized production data.

## 9. Backend Integration Requirements

The backend must manage:

1. Couple session creation.
2. Both partners' heart selections.
3. Independent Start confirmations.
4. Server-authoritative countdown.
5. Shared fusion seed and final heart data.
6. Fusion history.
7. Independent partner ratings.
8. Reconnection and session recovery.
9. Both-rating completion before returning to Couple Chat.

Only connected and mutually eligible couple partners can use this feature.

## 10. Rating System

Each partner submits an independent rating from 1 to 3 stars.

One partner's rating must never overwrite the other partner's rating.

The feature completes after both ratings are saved successfully.

## 11. Sound System

HeartbeatSound is currently a placeholder.

Future implementation requirements:

- Multiple heartbeat sound variations.
- Random sound selection per fusion.
- Same sound selection for both partners.
- Synchronized heartbeat timing.
- Countdown and fusion sound effects.
- User mute control.

## 12. Important Development Rule

This is a standalone feature module.

Do not modify the existing Couple Chat or production navigation while building and testing this module separately.

Integrate it into the existing Couple Chat only after standalone testing and backend synchronization are completed.

## 13. Current Development Status

- [x] Crystal Heart component
- [x] Heart selection screen
- [x] Romantic background
- [x] Surprise Heart generator
- [x] Fusion animation
- [x] Rating screen
- [x] Main feature screen
- [x] Component exports
- [ ] Standalone testing
- [ ] Backend synchronization
- [ ] Heartbeat audio integration
- [ ] Reconnection testing
- [ ] Couple Chat integration
- [ ] Final two-device testing

---

Project: UtaNexa

Feature: Two Hearts, One Love ❤️

Fusion System: Surprise Crystal Heart Fusion System

