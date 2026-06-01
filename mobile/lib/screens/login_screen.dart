import 'package:flutter/material.dart';

import '../config/app_config.dart';
import '../saknny_mobile_app.dart';
import 'debug_home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    required this.services,
    required this.firebaseStatus,
  });

  final SaknnyMobileServices services;
  final String firebaseStatus;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _firebaseUidController = TextEditingController();
  bool _loading = false;
  String? _message;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _firebaseUidController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() {
      _loading = true;
      _message = null;
    });

    try {
      final studentId = await widget.services.authService.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        firebaseUid: _firebaseUidController.text.trim(),
      );

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) =>
              DebugHomeScreen(services: widget.services, studentId: studentId),
        ),
      );
    } catch (error) {
      setState(() {
        _message = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Saknny Mobile Login')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Backend: ${AppConfig.apiBaseUrl}'),
          const SizedBox(height: 8),
          Text('Firebase: ${widget.firebaseStatus}'),
          const SizedBox(height: 24),
          TextField(
            controller: _emailController,
            decoration: const InputDecoration(labelText: 'Email'),
            keyboardType: TextInputType.emailAddress,
          ),
          TextField(
            controller: _passwordController,
            decoration: const InputDecoration(labelText: 'Password'),
            obscureText: true,
          ),
          TextField(
            controller: _firebaseUidController,
            decoration: const InputDecoration(
              labelText: 'Firebase UID',
              helperText:
                  'Temporary functional field until UI team wires profile data.',
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loading ? null : _login,
            child: Text(_loading ? 'Signing in...' : 'Login with backend JWT'),
          ),
          if (_message != null) ...[
            const SizedBox(height: 16),
            Text(_message!, style: const TextStyle(color: Colors.red)),
          ],
        ],
      ),
    );
  }
}
