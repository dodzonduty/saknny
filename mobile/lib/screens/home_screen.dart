import 'package:flutter/material.dart';

import '../saknny_mobile_app.dart';
import '../l10n/strings.dart';
import '../theme/app_colors.dart';
import 'attendance_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.services});

  final SaknnyMobileServices services;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    _initPostLogin();
  }

  Future<void> _initPostLogin() async {
    // Attempt Firebase bridge and FCM token registration if uid exists.
    try {
      final uid = await widget.services.sessionStore.getFirebaseUid();
      if (uid != null && uid.isNotEmpty) {
        // Firebase is already initialized and signed in via FirebaseAuth
        await widget.services.deviceService.registerFcmToken();
      }
    } catch (e) {
      // It's okay if Firebase fails (placeholder config)
      debugPrint('Firebase init failed: $e');
    }
  }

  void _logout() async {
    await widget.services.authService.logout();
    await widget.services.biometricService.clearEnrollment();
    if (!mounted) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => LoginScreen(services: widget.services),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final langCode = View.of(context).platformDispatcher.locale.languageCode;
    final isArabic = langCode == 'ar';
    final s = S(isArabic);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(s.attendance),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: s.logout,
            onPressed: _logout,
          ),
        ],
      ),
      body: AttendanceScreen(services: widget.services),
    );
  }
}
