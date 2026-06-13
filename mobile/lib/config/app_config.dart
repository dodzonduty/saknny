class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'SAKNNY_API_BASE_URL',
    defaultValue: 'http://192.168.1.34:8000/api/v1',
  );

  static const String platform = String.fromEnvironment(
    'SAKNNY_PLATFORM',
    defaultValue: 'android',
  );
}
