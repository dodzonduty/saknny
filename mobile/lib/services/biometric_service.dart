import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

class BiometricService {
  BiometricService({
    LocalAuthentication? auth,
    FlutterSecureStorage? secureStorage,
  }) : _auth = auth ?? LocalAuthentication(),
       _secureStorage = secureStorage ?? const FlutterSecureStorage();

  final LocalAuthentication _auth;
  final FlutterSecureStorage _secureStorage;

  static const _emailKey = 'saknny_bio_email';
  static const _passwordKey = 'saknny_bio_password';

  Future<bool> isBiometricAvailable() async {
    try {
      final canAuthenticateWithBiometrics = await _auth.canCheckBiometrics;
      final canAuthenticate =
          canAuthenticateWithBiometrics || await _auth.isDeviceSupported();
      return canAuthenticate;
    } on PlatformException {
      return false;
    }
  }

  Future<BiometricType?> getPreferredBiometricType() async {
    try {
      final availableBiometrics = await _auth.getAvailableBiometrics();
      debugPrint('Available biometrics: $availableBiometrics');
      
      if (availableBiometrics.contains(BiometricType.face)) {
        return BiometricType.face;
      }
      if (availableBiometrics.contains(BiometricType.fingerprint)) {
        return BiometricType.fingerprint;
      }
      // On Android, Face Unlock is often classified as 'weak'
      if (availableBiometrics.contains(BiometricType.weak)) {
        return BiometricType.face;
      }
      // Fallback for 'strong' as requested (usually fingerprint on Android)
      if (availableBiometrics.contains(BiometricType.strong)) {
        return BiometricType.fingerprint;
      }
      return null;
    } on PlatformException catch (e) {
      debugPrint('Biometric error: $e');
      return null;
    }
  }

  Future<bool> authenticate(String reason) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        biometricOnly: false, // Set false to allow Weak biometrics (Face Unlock) on Android
        persistAcrossBackgrounding: true,
      );
    } on PlatformException catch (e) {
      debugPrint('Auth error: $e');
      return false;
    }
  }

  Future<bool> authenticateForAttendance() async {
    return await authenticate('Please authenticate to confirm your attendance');
  }

  Future<bool> authenticateForAppUnlock() async {
    return await authenticate('Please authenticate to unlock Saknny');
  }

  Future<bool> isEnrolled() async {
    final email = await _secureStorage.read(key: _emailKey);
    final password = await _secureStorage.read(key: _passwordKey);
    return email != null && password != null;
  }

  Future<void> enrollCredentials(String email, String password) async {
    await _secureStorage.write(key: _emailKey, value: email);
    await _secureStorage.write(key: _passwordKey, value: password);
  }

  Future<Map<String, String>?> getStoredCredentials() async {
    final email = await _secureStorage.read(key: _emailKey);
    final password = await _secureStorage.read(key: _passwordKey);
    if (email != null && password != null) {
      return {'email': email, 'password': password};
    }
    return null;
  }

  Future<void> clearEnrollment() async {
    await _secureStorage.delete(key: _emailKey);
    await _secureStorage.delete(key: _passwordKey);
  }
}
