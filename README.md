# Healthee

A mobile app that helps you understand your body, prevent sickness, and maintain health by connecting your data and giving you clear explanations and practical steps.

> *"Here's what's happening in your body, and what to do about it."*

## Features

- **Today** — Body readiness score, top priority insight, and quick access to your routine
- **Insights** — Actionable alerts based on your logs and documents
- **Data** — Upload health documents and log daily check-ins
- **Routine** — Predictable daily habits and a structured check-in (energy, sleep, stress, symptoms)

## Run locally

```bash
npm install
npm start
```

Then press `a` for Android emulator, scan the QR code with **Expo Go** on your phone, or run `npm run web` for the browser preview.

### AI tips (optional)

On the **Today** tab, personalized tips use your profile, health snapshot, check-in, and routine. To enable them:

1. Copy `.env.example` to `.env`
2. Add an [OpenAI](https://platform.openai.com/api-keys) API key as `EXPO_PUBLIC_OPENAI_API_KEY`
3. Restart the dev server

For production, prefer `EXPO_PUBLIC_HEALTH_INSIGHTS_API_URL` pointing at your own server so the API key stays off the phone.

## Stack

- [Expo](https://expo.dev) SDK 56
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based navigation)
- React Native + TypeScript

## Project structure

```
app/
  (tabs)/          # Main tab screens
  insight/[id].tsx # Insight detail with rich summary and interactive actions checklist
components/        # UI building blocks
context/           # App state (habits, check-ins, completed actions)
data/              # Onboarding configurations and options
types/             # TypeScript models
```

## Next steps (production)

- Backend for personalized models and historical trends
- Push notifications for routine reminders and early sickness signals
- Clinician-reviewed content library for actions

## Disclaimer

Healthee explains patterns from health data—it does not provide medical diagnosis. Consult a healthcare professional for persistent or severe symptoms.
