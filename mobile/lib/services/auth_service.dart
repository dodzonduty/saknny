import 'package:firebase_auth/firebase_auth.dart';

import 'api_client.dart';
import 'session_store.dart';

class AuthService {
  AuthService({
    required ApiClient apiClient,
    required SessionStore sessionStore,
    FirebaseAuth? firebaseAuth,
  })  : _apiClient = apiClient,
        _sessionStore = sessionStore,
        _firebaseAuth = firebaseAuth;

  final ApiClient _apiClient;
  final SessionStore _sessionStore;
  final FirebaseAuth? _firebaseAuth;

  Future<void> loadPersistedToken() async {
    // No longer relies on FastAPI JWT token
  }

  Future<void> login({required String email, required String password}) async {
    final auth = _firebaseAuth ?? FirebaseAuth.instance;
    final userCredential = await auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );

    final firebaseUid = userCredential.user!.uid;
    final userName = userCredential.user!.displayName ?? 'Student';
    final firebaseToken = await userCredential.user!.getIdToken();
    if (firebaseToken == null) throw Exception('Failed to get Firebase token');

    // 2. Token Exchange: Send Firebase token to backend, get FastAPI token
    final exchangeResponse = await _apiClient.post(
      '/auth/firebase-login',
      {'token': firebaseToken},
    );

    final fastApiToken = exchangeResponse['access_token'] as String;
    final studentId = exchangeResponse['user_id'] as int;

    // 3. Save the FastAPI token securely
    await _sessionStore.saveAuthSession(
      accessToken: fastApiToken,
      studentId: studentId,
      userName: userName,
      firebaseUid: firebaseUid,
    );
    
    _apiClient.setAccessToken(fastApiToken);
  }

  Future<void> loginWithStoredCredentials(String email, String password) async {
    return login(email: email, password: password);
  }

  Future<void> logout() async {
    await (_firebaseAuth ?? FirebaseAuth.instance).signOut();
    await _sessionStore.clear();
    _apiClient.setAccessToken(null);
  }

  Future<bool> tryRestoreSession() async {
    final auth = _firebaseAuth ?? FirebaseAuth.instance;
    final currentUser = auth.currentUser;
    if (currentUser != null) {
      final token = await _sessionStore.getAccessToken();
      if (token != null) {
        // Just use the persisted FastAPI token for local high-speed validation
        _apiClient.setAccessToken(token);
        return true;
      }
    }
    return false;
  }
}
