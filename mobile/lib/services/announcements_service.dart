import 'api_client.dart';

class AnnouncementsService {
  AnnouncementsService({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  Future<Map<String, dynamic>> fetchAnnouncements() {
    return _apiClient.get('/announcements');
  }
}
