import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../l10n/strings.dart';
import '../saknny_mobile_app.dart';
import '../theme/app_colors.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.services});

  final SaknnyMobileServices services;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _loading = false;
  bool _obscurePassword = true;
  String? _errorMessage;
  bool _isArabic = false;
  bool _biometricEnrolled = false;

  S get s => S(_isArabic);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final langCode = View.of(context).platformDispatcher.locale.languageCode;
      setState(() => _isArabic = langCode == 'ar');
      _checkBiometricStatus();
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _checkBiometricStatus() async {
    final enrolled = await widget.services.biometricService.isEnrolled();
    if (mounted) {
      setState(() {
        _biometricEnrolled = enrolled;
      });
    }
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      await widget.services.authService.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (!mounted) return;

      // Check if biometric enrollment is needed
      final bioService = widget.services.biometricService;
      final available = await bioService.isBiometricAvailable();
      final enrolled = await bioService.isEnrolled();

      if (available && !enrolled) {
        _showBiometricEnrollmentPrompt(
          _emailController.text.trim(),
          _passwordController.text,
        );
      } else {
        _navigateToHome();
      }
    } on FirebaseAuthException catch (e) {
      setState(() {
        if (e.code == 'network-request-failed') {
          _errorMessage = s.networkError;
        } else if (e.code == 'user-not-found' ||
            e.code == 'wrong-password' ||
            e.code == 'invalid-credential') {
          _errorMessage = s.loginError;
        } else {
          _errorMessage = e.message ?? s.loginError;
        }
      });
    } catch (error) {
      setState(() {
        _errorMessage = error.toString().contains('SocketException')
            ? s.networkError
            : s.loginError;
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _loginWithBiometric() async {
    final bioService = widget.services.biometricService;
    final success = await bioService.authenticate(s.biometricPrompt);
    if (!success) return;

    final credentials = await bioService.getStoredCredentials();
    if (credentials == null) return;

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      await widget.services.authService.loginWithStoredCredentials(
        credentials['email']!,
        credentials['password']!,
      );
      _navigateToHome();
    } catch (error) {
      setState(() {
        _errorMessage = s.loginError;
        _loading = false;
      });
    }
  }

  void _showBiometricEnrollmentPrompt(String email, String password) {
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.fingerprint_rounded,
              size: 64,
              color: AppColors.primary,
            ),
            const SizedBox(height: 16),
            Text(
              s.enableBiometric,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              s.biometricEnrollDesc,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      _navigateToHome();
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                    ),
                    child: Text(s.skip),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      final success = await widget.services.biometricService
                          .authenticate(s.biometricPrompt);
                      if (success) {
                        await widget.services.biometricService
                            .enrollCredentials(email, password);
                      }
                      if (context.mounted) {
                        Navigator.pop(context);
                        _navigateToHome();
                      }
                    },
                    child: Text(s.enable),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _navigateToHome() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => HomeScreen(services: widget.services),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;

    return Directionality(
      textDirection: _isArabic ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: Column(
          children: [
            // Header
            Container(
              width: double.infinity,
              padding: EdgeInsets.fromLTRB(24, topPad + 20, 24, 40),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppColors.primary, AppColors.primaryContainer],
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(32),
                  bottomRight: Radius.circular(32),
                ),
              ),
              child: Stack(
                children: [
                  Align(
                    alignment: _isArabic
                        ? Alignment.topLeft
                        : Alignment.topRight,
                    child: IconButton(
                      icon: const Icon(Icons.language, color: Colors.white70),
                      onPressed: () => setState(() => _isArabic = !_isArabic),
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const SizedBox(height: 20),
                      Icon(
                        Icons.apartment_rounded,
                        size: 64,
                        color: AppColors.accentYellow.withValues(alpha: 0.9),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        s.appName,
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          color: AppColors.onPrimary,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        s.loginTitle,
                        style: TextStyle(
                          fontSize: 16,
                          color: AppColors.onPrimary.withValues(alpha: 0.8),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Form
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                physics: const BouncingScrollPhysics(),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      if (_errorMessage != null)
                        Container(
                          padding: const EdgeInsets.all(16),
                          margin: const EdgeInsets.only(bottom: 24),
                          decoration: BoxDecoration(
                            color: AppColors.errorContainer,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppColors.error.withValues(alpha: 0.3),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.error_outline,
                                color: AppColors.error,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: const TextStyle(
                                    color: AppColors.error,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          labelText: s.emailLabel,
                          prefixIcon: const Icon(Icons.email_outlined),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(
                              color: AppColors.outline,
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(
                              color: AppColors.outlineVariant,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(
                              color: AppColors.primary,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: AppColors.surface,
                        ),
                        validator: (value) =>
                            value == null || value.isEmpty ? '*' : null,
                      ),
                      const SizedBox(height: 16),

                      TextFormField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        decoration: InputDecoration(
                          labelText: s.passwordLabel,
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_off
                                  : Icons.visibility,
                              color: AppColors.outline,
                            ),
                            onPressed: () {
                              setState(
                                () => _obscurePassword = !_obscurePassword,
                              );
                            },
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(
                              color: AppColors.outline,
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(
                              color: AppColors.outlineVariant,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(
                              color: AppColors.primary,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: AppColors.surface,
                        ),
                        validator: (value) =>
                            value == null || value.isEmpty ? '*' : null,
                      ),
                      const SizedBox(height: 32),

                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _login,
                          style: ElevatedButton.styleFrom(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: _loading
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 3,
                                    valueColor: AlwaysStoppedAnimation(
                                      AppColors.primary,
                                    ),
                                  ),
                                )
                              : Text(
                                  s.loginButton,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                      ),

                      if (_biometricEnrolled) ...[
                        const SizedBox(height: 32),
                        const Divider(),
                        const SizedBox(height: 16),
                        IconButton(
                          iconSize: 64,
                          icon: const Icon(
                            Icons.fingerprint_rounded,
                            size: 48,
                            color: AppColors.primary,
                          ),
                          onPressed: _loading ? null : _loginWithBiometric,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
