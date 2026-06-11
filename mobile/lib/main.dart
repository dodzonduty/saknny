// ══════════════════════════════════════════════════════
//  DEMO MODE — UI preview without backend / Firebase
//  To restore original: git checkout lib/main.dart
// ══════════════════════════════════════════════════════

import 'package:flutter/material.dart';

import 'screens/attendance_demo_screen.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SaknnyDemoApp());
}

class SaknnyDemoApp extends StatelessWidget {
  const SaknnyDemoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Saknny',
      theme: AppTheme.light(),
      home: const AttendanceDemoScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
