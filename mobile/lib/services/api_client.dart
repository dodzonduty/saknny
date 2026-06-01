import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.data});

  final String message;
  final Object? data;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({http.Client? httpClient})
    : _httpClient = httpClient ?? http.Client();

  final http.Client _httpClient;
  String? _accessToken;

  void setAccessToken(String? token) {
    _accessToken = token;
  }

  Future<Map<String, dynamic>> get(String path) async {
    final response = await _httpClient.get(_uri(path), headers: _headers());
    return _decodeEnvelope(response);
  }

  Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body,
  ) async {
    final response = await _httpClient.post(
      _uri(path),
      headers: _headers(),
      body: jsonEncode(body),
    );
    return _decodeEnvelope(response);
  }

  Uri _uri(String path) => Uri.parse('${AppConfig.apiBaseUrl}$path');

  Map<String, String> _headers() {
    return {
      'Content-Type': 'application/json',
      if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
    };
  }

  Map<String, dynamic> _decodeEnvelope(http.Response response) {
    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final success = decoded['success'] == true;
    final data = decoded['data'];
    final error = decoded['error'];

    if (!success) {
      throw ApiException(error?.toString() ?? 'Request failed', data: data);
    }

    return (data as Map?)?.cast<String, dynamic>() ?? <String, dynamic>{};
  }
}
