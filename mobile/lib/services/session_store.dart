import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SessionStore {
  static const _accessTokenKey = 'saknny_access_token';
  static const _studentIdKey = 'saknny_student_id';
  static const _userNameKey = 'saknny_user_name';
  static const _firebaseUidKey = 'saknny_firebase_uid';
  static const _deviceIdKey = 'saknny_device_id';

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  Future<void> _migrateIfNeeded() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.containsKey(_accessTokenKey)) {
      final token = prefs.getString(_accessTokenKey);
      final studentId = prefs.getInt(_studentIdKey);
      final userName = prefs.getString(_userNameKey);
      final firebaseUid = prefs.getString(_firebaseUidKey);

      if (token != null) {
        await _secureStorage.write(key: _accessTokenKey, value: token);
      }
      if (studentId != null) {
        await _secureStorage.write(key: _studentIdKey, value: studentId.toString());
      }
      if (userName != null) {
        await _secureStorage.write(key: _userNameKey, value: userName);
      }
      if (firebaseUid != null) {
        await _secureStorage.write(key: _firebaseUidKey, value: firebaseUid);
      }

      await prefs.remove(_accessTokenKey);
      await prefs.remove(_studentIdKey);
      await prefs.remove(_userNameKey);
      await prefs.remove(_firebaseUidKey);
    }
  }

  Future<void> saveAuthSession({
    required String accessToken,
    required int studentId,
    required String userName,
    required String firebaseUid,
  }) async {
    await _secureStorage.write(key: _accessTokenKey, value: accessToken);
    await _secureStorage.write(key: _studentIdKey, value: studentId.toString());
    await _secureStorage.write(key: _userNameKey, value: userName);
    await _secureStorage.write(key: _firebaseUidKey, value: firebaseUid);
  }

  Future<String?> getAccessToken() async {
    await _migrateIfNeeded();
    return await _secureStorage.read(key: _accessTokenKey);
  }

  Future<int?> getStudentId() async {
    await _migrateIfNeeded();
    final value = await _secureStorage.read(key: _studentIdKey);
    return value != null ? int.tryParse(value) : null;
  }

  Future<String?> getUserName() async {
    await _migrateIfNeeded();
    return await _secureStorage.read(key: _userNameKey);
  }

  Future<String?> getFirebaseUid() async {
    await _migrateIfNeeded();
    return await _secureStorage.read(key: _firebaseUidKey);
  }

  Future<String> getOrCreateDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(_deviceIdKey);
    if (existing != null) {
      return existing;
    }
    final created = 'flutter-${DateTime.now().microsecondsSinceEpoch}';
    await prefs.setString(_deviceIdKey, created);
    return created;
  }

  Future<void> clear() async {
    await _secureStorage.delete(key: _accessTokenKey);
    await _secureStorage.delete(key: _studentIdKey);
    await _secureStorage.delete(key: _userNameKey);
    await _secureStorage.delete(key: _firebaseUidKey);
  }
}
