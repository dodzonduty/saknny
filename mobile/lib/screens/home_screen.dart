import 'package:flutter/material.dart';

import '../saknny_mobile_app.dart';
import '../l10n/strings.dart';
import '../theme/app_colors.dart';
import 'attendance_screen.dart';
import 'attendance_log_screen.dart';
import 'announcements_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.services});

  final SaknnyMobileServices services;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

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
      body: Stack(
        children: [
          IndexedStack(
            index: _currentIndex,
            children: [
              AttendanceScreen(services: widget.services),
              AttendanceLogScreen(services: widget.services),
              AnnouncementsScreen(services: widget.services),
            ],
          ),
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            right: isArabic ? null : 16,
            left: isArabic ? 16 : null,
            child: IconButton(
              icon: const Icon(Icons.logout_rounded, color: AppColors.onPrimary),
              tooltip: s.logout,
              onPressed: _logout,
            ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.accentYellow.withValues(alpha: 0.3),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.fingerprint_rounded),
            label: s.tabAttendance,
          ),
          NavigationDestination(
            icon: const Icon(Icons.calendar_month_rounded),
            label: s.tabMyRecord,
          ),
          NavigationDestination(
            icon: const Icon(Icons.campaign_rounded),
            label: s.tabAnnouncements,
          ),
        ],
      ),
    );
  }
}
