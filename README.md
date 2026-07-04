# 🚀 Space Escape Runner

A fast-paced, minimalist arcade game built entirely with **React Native** and **Expo** — no images, no external assets, just pure Views, shapes, and animations.

Pilot your spaceship, dodge falling asteroids, and see how long you can survive. Every point counts, and every collision ends the run.

## 🎮 Gameplay

- Control a spaceship built entirely from React Native `View` components — no image assets used
- Move left and right using on-screen controls
- Dodge continuously falling asteroids
- Score a point every time you successfully avoid an asteroid
- Real-time collision detection ends the game on impact
- Persistent high score saved locally on your device using `AsyncStorage`
- Smooth animations for ship movement, asteroid rotation, and UI transitions

## 🛠️ Built With

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- React Native's built-in `Animated` API

## 📱 Screenshots

*(Add screenshots or a gameplay GIF here once available)*

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Expo Go](https://expo.dev/go) app installed on your phone (iOS/Android)

### Installation

```bash
git clone https://github.com/<your-username>/SpaceEscapeRunner.git
cd SpaceEscapeRunner
npm install
```

### Running the App

```bash
npx expo start
```

Scan the QR code shown in your terminal using the Expo Go app (Android) or your Camera app (iOS) to run the game on your device.

## 📦 Building for Android

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) to generate installable Android builds.

```bash
# Preview build (installable .apk)
eas build --platform android --profile preview

# Production build (.aab for Google Play)
eas build --platform android --profile production
```

## 🎯 How to Play

1. Tap **Start Game**
2. Use the **◀** and **▶** buttons to move your spaceship left and right
3. Avoid the falling asteroids
4. Your score increases each time an asteroid passes safely
5. Try to beat your high score before you crash!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙌 Acknowledgments

Built as a learning project to explore React Native fundamentals — state management, animations, collision detection, and local storage — using only Expo's built-in tools.
