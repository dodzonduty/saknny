import 'package:firebase_auth/firebase_auth.dart';

import 'session_store.dart';

class AuthService {
  AuthService({required SessionStore sessionStore, FirebaseAuth? firebaseAuth})
    : _sessionStore = sessionStore,
      _firebaseAuth = firebaseAuth;

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
    final token = await userCredential.user!.getIdToken();

    await _sessionStore.saveAuthSession(
      accessToken: token ?? '',
      studentId: 0, // Not used in Firebase-First flow
      userName: userName,
      firebaseUid: firebaseUid,
    );
  }

  Future<void> loginWithStoredCredentials(String email, String password) async {
    return login(email: email, password: password);
  }

  Future<void> logout() async {
    await (_firebaseAuth ?? FirebaseAuth.instance).signOut();
    await _sessionStore.clear();
  }

  Future<bool> tryRestoreSession() async {
    final auth = _firebaseAuth ?? FirebaseAuth.instance;
    final currentUser = auth.currentUser;
    if (currentUser != null) {
      final token = await _sessionStore.getAccessToken();
      if (token != null) {
        return true;
      }
    }
    return false;
  }
}
