import 'dart:math';

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

  /// Fetch the student's current allocation including room geofence data.
  Future<Map<String, dynamic>?> fetchAllocation() async {
    final data = await _apiClient.get('/allocations/me');
    return data['allocation'] as Map<String, dynamic>?;
  }

  /// Client-side Haversine distance in meters between two lat/lng pairs.
  static double haversineMeters(
    double lat1, double lon1,
    double lat2, double lon2,
  ) {
    const earthRadius = 6371000.0; // meters
    final dLat = _toRadians(lat2 - lat1);
    final dLon = _toRadians(lon2 - lon1);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRadians(lat1)) * cos(_toRadians(lat2)) *
        sin(dLon / 2) * sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return earthRadius * c;
  }

  static double _toRadians(double deg) => deg * pi / 180;

  Future<Map<String, dynamic>> checkInWithCurrentLocation({Position? positionOverride}) async {
    final position = positionOverride ?? await _getCurrentPosition();
    final firebaseUid = await _sessionStore.getFirebaseUid();
    final deviceId = await _sessionStore.getOrCreateDeviceId();

    if (firebaseUid == null || firebaseUid.isEmpty) {
      throw const ApiException('Missing saved student session');
    }

    final payload = {
      'firebase_uid': firebaseUid,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'timestamp': DateTime.now().toUtc().toIso8601String(),
      'device_id': deviceId,
      'biometric_verified': true,
    };

    return _apiClient.post('/attendance/check-in', payload);
  }

  Future<Map<String, dynamic>> fetchScore() {
    return _apiClient.get('/attendance/score');
  }

  Future<Map<String, dynamic>> fetchAttendanceLog(int year, int month) {
    return _apiClient.get('/attendance/log?year=$year&month=$month');
  }

  /// Get the current GPS position with permission handling.
  /// Exposed publicly so the attendance screen can use it for proximity checks.
  Future<Position> getCurrentPosition() => _getCurrentPosition();

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

