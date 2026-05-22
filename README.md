# Healthy

A mobile app that helps you understand your body, prevent sickness, and maintain health by connecting your data and explaining **cause → effect → action**.

> *"Here's what's happening in your body, and what to do about it."*

## Features

- **Today** — Body readiness score, top priority insight, and quick access to your routine
- **Insights** — Every alert follows Cause → Effect → Action with connected wearable signals
- **Data** — Link Apple Health, Oura, WHOOP, Fitbit, and manual check-ins (demo toggles)
- **Routine** — Predictable daily habits and a structured check-in (energy, sleep, stress, symptoms)

## Run locally

```bash
npm install
npm start
```

Then press `a` for Android emulator, scan the QR code with **Expo Go** on your phone, or run `npm run web` for the browser preview.

## Stack

- [Expo](https://expo.dev) SDK 56
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based navigation)
- React Native + TypeScript

## Project structure

```
app/
  (tabs)/          # Main tab screens
  insight/[id].tsx # Insight detail with full cause→effect→action
components/        # UI building blocks
context/           # App state (habits, check-ins, completed actions)
data/              # Mock insights and data sources
types/             # TypeScript models
```

## Next steps (production)

- Integrate Apple Health / Health Connect via `react-native-health` or Expo modules
- Backend for personalized models and historical trends
- Push notifications for routine reminders and early sickness signals
- Clinician-reviewed content library for actions

## Disclaimer

Healthy explains patterns from health data—it does not provide medical diagnosis. Consult a healthcare professional for persistent or severe symptoms.
