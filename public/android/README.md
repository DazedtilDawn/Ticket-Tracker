# Ticket Tracker Android App

This directory contains the files needed to build a native Android app wrapper around the Ticket Tracker web application.

## Building the Android App

1. Create a new Android Studio project with an Empty Activity
2. Copy the Java files (MainActivity.java and SplashActivity.java) to your project's src/main/java/com/tickettracker/app/ directory
3. Copy the layout XML files to your project's res/layout/ directory
4. Copy the drawable XML files to your project's res/drawable/ directory
5. Update the AndroidManifest.xml with the contents of the AndroidManifest.xml file in this directory
6. In MainActivity.java, update the baseUrl variable to point to your deployed Replit app URL

## App Features

The Android app wrapper provides:

- Native splash screen
- Offline detection and messaging
- Haptic feedback for interactions
- Native toast notifications
- WebView optimization for performance
- "Add to Home Screen" experience

## Web Features Available in the App

- Goal progress tracking
- Chore management
- Reward system with tickets
- Transaction history
- Profile management
- Banner customization

## Building for Production

When ready for production:

1. Generate proper app icons in Android Studio
2. Configure app signing for Play Store distribution
3. Test on various Android devices
4. Update the version code and name in AndroidManifest.xml
