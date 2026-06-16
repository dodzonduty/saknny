import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';

import 'firebase_options.dart';
import 'saknny_mobile_app.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'theme/app_colors.dart';
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

  runApp(SaknnyApp(services: services));
}

class SaknnyApp extends StatelessWidget {
  const SaknnyApp({
    super.key,
    required this.services,
  });

  final SaknnyMobileServices services;

  @override
  Widget build(BuildContext context) {
    // Detect device locale for Arabic
    final langCode = View.of(context).platformDispatcher.locale.languageCode;
    final isArabic = langCode == 'ar';

    return MaterialApp(
      title: 'Saknny',
      theme: AppTheme.light(isArabic: isArabic),
      home: SplashScreen(services: services),
      debugShowCheckedModeBanner: false,
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, required this.services});
  final SaknnyMobileServices services;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initApp();
    });
  }

  Future<void> _initApp() async {
    final bioEnrolled = await widget.services.biometricService.isEnrolled();
    Widget nextScreen = LoginScreen(services: widget.services);

    if (bioEnrolled) {
      final success = await widget.services.biometricService.authenticateForAppUnlock();
      if (success) {
        if (await widget.services.authService.tryRestoreSession()) {
          nextScreen = HomeScreen(services: widget.services);
        } else {
          final creds = await widget.services.biometricService.getStoredCredentials();
          if (creds != null) {
            try {
              await widget.services.authService.loginWithStoredCredentials(
                creds['email']!,
                creds['password']!,
              );
              nextScreen = HomeScreen(services: widget.services);
            } catch (_) {}
          }
        }
      }
    } else {
      if (await widget.services.authService.tryRestoreSession()) {
        nextScreen = HomeScreen(services: widget.services);
      }
    }

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => nextScreen),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: CircularProgressIndicator(color: AppColors.onPrimary),
      ),
    );
  }
}
