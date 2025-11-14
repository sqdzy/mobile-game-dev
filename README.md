# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Connect to the Flask API

This repository contains a companion Flask service under `server/` that stores player accounts, coins and leaderboard data.

1. Install and run the backend (see `server/README.md` for the full guide):

   ```powershell
   cd server
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   flask --app app run --port 5001
   ```

2. Point the Expo app to the API before starting Metro. The client reads `process.env.EXPO_PUBLIC_API_BASE_URL` (defaults to `http://localhost:5001/api`). Example for PowerShell:

   ```powershell
   $env:EXPO_PUBLIC_API_BASE_URL = "http://localhost:5001/api"
   npm start
   ```

   On macOS/Linux use `export EXPO_PUBLIC_API_BASE_URL=http://localhost:5001/api`.

With the server running you can register/login with a nickname + password, sync coins/upgrades/stats across devices, and view the secure leaderboard inside the "Лига героев" tab.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
