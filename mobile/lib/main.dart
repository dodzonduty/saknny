import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';

import 'firebase_options.dart';
import 'saknny_mobile_app.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e) {
    debugPrint('Firebase initialization failed: $e');
  }

  final services = SaknnyMobileServices.create();

  // Determine initial route
  Widget initialScreen = LoginScreen(services: services);

  // 1. Check for biometric auto-login
  final bioEnrolled = await services.biometricService.isEnrolled();
  if (bioEnrolled) {
    final success = await services.biometricService.authenticateForAppUnlock();
    if (success) {
      if (await services.authService.tryRestoreSession()) {
        initialScreen = HomeScreen(services: services);
      } else {
        final creds = await services.biometricService.getStoredCredentials();
        if (creds != null) {
          try {
            await services.authService.loginWithStoredCredentials(
              creds['email']!,
              creds['password']!,
            );
            initialScreen = HomeScreen(services: services);
          } catch (_) {
            // If auto-login fails, stay on LoginScreen
          }
        }
      }
    }
  } else {
    // 2. Check for saved JWT token
    if (await services.authService.tryRestoreSession()) {
      initialScreen = HomeScreen(services: services);
    }
  }

  runApp(SaknnyApp(services: services, initialScreen: initialScreen));
}

class SaknnyApp extends StatelessWidget {
  const SaknnyApp({
    super.key,
    required this.services,
    required this.initialScreen,
  });

  final SaknnyMobileServices services;
  final Widget initialScreen;

  @override
  Widget build(BuildContext context) {
    // Detect device locale for Arabic
    final langCode = View.of(context).platformDispatcher.locale.languageCode;
    final isArabic = langCode == 'ar';

    return MaterialApp(
      title: 'Saknny',
      theme: AppTheme.light(isArabic: isArabic),
      home: initialScreen,
      debugShowCheckedModeBanner: false,
    );
  }
}
