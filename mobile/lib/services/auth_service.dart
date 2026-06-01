import 'package:firebase_auth/firebase_auth.dart';

import 'api_client.dart';
import 'session_store.dart';

class AuthService {
  AuthService({
    required ApiClient apiClient,
    required SessionStore sessionStore,
    FirebaseAuth? firebaseAuth,
  }) : _apiClient = apiClient,
       _sessionStore = sessionStore,
       _firebaseAuth = firebaseAuth;

  final ApiClient _apiClient;
  final SessionStore _sessionStore;
  final FirebaseAuth? _firebaseAuth;

  Future<void> loadPersistedToken() async {
    _apiClient.setAccessToken(await _sessionStore.getAccessToken());
  }

  Future<int> login({
    required String email,
    required String password,
    required String firebaseUid,
  }) async {
    final data = await _apiClient.post('/auth/login', {
      'email': email,
      'password': password,
    });

    final accessToken = data['access_token'] as String;
    final studentId = data['user_id'] as int;
    _apiClient.setAccessToken(accessToken);

    await _sessionStore.saveAuthSession(
      accessToken: accessToken,
      studentId: studentId,
      firebaseUid: firebaseUid,
    );

    return studentId;
  }

  Future<String> requestFirebaseCustomToken() async {
    final firebaseUid = await _sessionStore.getFirebaseUid();
    if (firebaseUid == null || firebaseUid.isEmpty) {
      throw const ApiException(
        'Firebase UID is required for mobile token bridge',
      );
    }

    final data = await _apiClient.post('/mobile/firebase-token', {
      'firebase_uid': firebaseUid,
    });
    final customToken = data['firebase_custom_token'] as String;
    await (_firebaseAuth ?? FirebaseAuth.instance).signInWithCustomToken(
      customToken,
    );
    return customToken;
  }

  Future<void> logout() async {
    await (_firebaseAuth ?? FirebaseAuth.instance).signOut();
    await _sessionStore.clear();
    _apiClient.setAccessToken(null);
  }
}
