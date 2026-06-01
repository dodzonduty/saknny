import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import 'saknny_mobile_app.dart';
import 'screens/login_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final firebaseStatus = await _initializeFirebaseSafely();
  final services = SaknnyMobileServices.create();
  await services.authService.loadPersistedToken();

  runApp(SaknnyMobileApp(services: services, firebaseStatus: firebaseStatus));
}

Future<String> _initializeFirebaseSafely() async {
  try {
    await Firebase.initializeApp();
    return 'initialized';
  } catch (error) {
    return 'not initialized ($error)';
  }
}

class SaknnyMobileApp extends StatelessWidget {
  const SaknnyMobileApp({
    super.key,
    required this.services,
    required this.firebaseStatus,
  });

  final SaknnyMobileServices services;
  final String firebaseStatus;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Saknny Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: LoginScreen(services: services, firebaseStatus: firebaseStatus),
    );
  }
}
