import 'services/announcements_service.dart';
import 'services/api_client.dart';
import 'services/attendance_service.dart';
import 'services/auth_service.dart';
import 'services/biometric_service.dart';
import 'services/device_service.dart';
import 'services/session_store.dart';

class SaknnyMobileServices {
  SaknnyMobileServices({
    required this.apiClient,
    required this.sessionStore,
    required this.authService,
    required this.deviceService,
    required this.attendanceService,
    required this.biometricService,
    required this.announcementsService,
  });

  factory SaknnyMobileServices.create() {
    final apiClient = ApiClient();
    final sessionStore = SessionStore();
    return SaknnyMobileServices(
      apiClient: apiClient,
      sessionStore: sessionStore,
      authService: AuthService(sessionStore: sessionStore),
      deviceService: DeviceService(
        apiClient: apiClient,
        sessionStore: sessionStore,
      ),
      attendanceService: AttendanceService(
        apiClient: apiClient,
        sessionStore: sessionStore,
      ),
      biometricService: BiometricService(),
      announcementsService: AnnouncementsService(apiClient: apiClient),
    );
  }

  final ApiClient apiClient;
  final SessionStore sessionStore;
  final AuthService authService;
  final DeviceService deviceService;
  final AttendanceService attendanceService;
  final BiometricService biometricService;
  final AnnouncementsService announcementsService;
}
