import 'dart:convert';

import 'package:flutter/material.dart';

import '../saknny_mobile_app.dart';

class DebugHomeScreen extends StatefulWidget {
  const DebugHomeScreen({
    super.key,
    required this.services,
    required this.studentId,
  });

  final SaknnyMobileServices services;
  final int studentId;

  @override
  State<DebugHomeScreen> createState() => _DebugHomeScreenState();
}

class _DebugHomeScreenState extends State<DebugHomeScreen> {
  bool _busy = false;
  String _output = 'Ready.';

  Future<void> _run(String label, Future<Object?> Function() action) async {
    setState(() {
      _busy = true;
      _output = '$label...';
    });

    try {
      final result = await action();
      setState(() {
        _output = const JsonEncoder.withIndent(
          '  ',
        ).convert({'operation': label, 'result': result ?? 'ok'});
      });
    } catch (error) {
      setState(() {
        _output = const JsonEncoder.withIndent(
          '  ',
        ).convert({'operation': label, 'error': error.toString()});
      });
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Student ${widget.studentId} Debug')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _ActionButton(
            label: 'Get Firebase custom token',
            busy: _busy,
            onPressed: () => _run(
              'firebase_custom_token',
              widget.services.authService.requestFirebaseCustomToken,
            ),
          ),
          _ActionButton(
            label: 'Register FCM token',
            busy: _busy,
            onPressed: () => _run(
              'register_fcm_token',
              widget.services.deviceService.registerFcmToken,
            ),
          ),
          _ActionButton(
            label: 'Check attendance with current GPS',
            busy: _busy,
            onPressed: () => _run(
              'attendance_check_in',
              widget.services.attendanceService.checkInWithCurrentLocation,
            ),
          ),
          _ActionButton(
            label: 'Refresh attendance score',
            busy: _busy,
            onPressed: () => _run(
              'attendance_score',
              widget.services.attendanceService.fetchScore,
            ),
          ),
          const SizedBox(height: 16),
          const Text('Raw output'),
          const SizedBox(height: 8),
          DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.black87,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: SelectableText(
                _output,
                style: const TextStyle(
                  color: Colors.white,
                  fontFamily: 'monospace',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.busy,
    required this.onPressed,
  });

  final String label;
  final bool busy;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: ElevatedButton(
        onPressed: busy ? null : onPressed,
        child: Text(label),
      ),
    );
  }
}
