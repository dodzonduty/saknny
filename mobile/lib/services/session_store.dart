import 'package:shared_preferences/shared_preferences.dart';

class SessionStore {
  static const _accessTokenKey = 'saknny_access_token';
  static const _studentIdKey = 'saknny_student_id';
  static const _userNameKey = 'saknny_user_name';
  static const _firebaseUidKey = 'saknny_firebase_uid';
  static const _deviceIdKey = 'saknny_device_id';

  Future<void> saveAuthSession({
    required String accessToken,
    required int studentId,
    required String userName,
    required String firebaseUid,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, accessToken);
    await prefs.setInt(_studentIdKey, studentId);
    await prefs.setString(_userNameKey, userName);
    await prefs.setString(_firebaseUidKey, firebaseUid);
  }

  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_accessTokenKey);
  }

  Future<int?> getStudentId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_studentIdKey);
  }

  Future<String?> getUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userNameKey);
  }

  Future<String?> getFirebaseUid() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_firebaseUidKey);
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
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_studentIdKey);
    await prefs.remove(_userNameKey);
    await prefs.remove(_firebaseUidKey);
  }
}
