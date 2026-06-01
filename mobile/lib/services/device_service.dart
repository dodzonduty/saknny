import 'package:firebase_messaging/firebase_messaging.dart';

import '../config/app_config.dart';
import 'api_client.dart';
import 'session_store.dart';

class DeviceService {
  DeviceService({
    required ApiClient apiClient,
    required SessionStore sessionStore,
    FirebaseMessaging? messaging,
  }) : _apiClient = apiClient,
       _sessionStore = sessionStore,
       _messaging = messaging;

  final ApiClient _apiClient;
  final SessionStore _sessionStore;
  final FirebaseMessaging? _messaging;

  Future<String> registerFcmToken() async {
    final messaging = _messaging ?? FirebaseMessaging.instance;
    await messaging.requestPermission();
    final token = await messaging.getToken();
    if (token == null || token.isEmpty) {
      throw const ApiException('FCM token is not available yet');
    }

    final deviceId = await _sessionStore.getOrCreateDeviceId();
    await _apiClient.post('/devices/register', {
      'fcm_token': token,
      'device_id': deviceId,
      'platform': AppConfig.platform,
    });

    return token;
  }
}
