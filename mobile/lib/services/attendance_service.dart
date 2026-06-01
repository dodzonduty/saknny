import 'package:geolocator/geolocator.dart';

import 'api_client.dart';
import 'session_store.dart';

class AttendanceService {
  AttendanceService({
    required ApiClient apiClient,
    required SessionStore sessionStore,
  }) : _apiClient = apiClient,
       _sessionStore = sessionStore;

  final ApiClient _apiClient;
  final SessionStore _sessionStore;

  Future<Map<String, dynamic>> checkInWithCurrentLocation() async {
    final position = await _getCurrentPosition();
    final studentId = await _sessionStore.getStudentId();
    final firebaseUid = await _sessionStore.getFirebaseUid();
    final deviceId = await _sessionStore.getOrCreateDeviceId();

    if (studentId == null || firebaseUid == null) {
      throw const ApiException('Missing saved student session');
    }

    return _apiClient.post('/attendance/check-in', {
      'student_id': studentId,
      'firebase_uid': firebaseUid,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'timestamp': DateTime.now().toUtc().toIso8601String(),
      'device_id': deviceId,
    });
  }

  Future<Map<String, dynamic>> fetchScore() {
    return _apiClient.get('/attendance/score');
  }

  Future<Position> _getCurrentPosition() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw const ApiException('Location services are disabled');
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      throw const ApiException('Location permission denied');
    }
    if (permission == LocationPermission.deniedForever) {
      throw const ApiException('Location permission permanently denied');
    }

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
  }
}
