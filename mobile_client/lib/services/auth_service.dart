import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  static const _storage = FlutterSecureStorage();
  
  static String? _baseUrl;
  static String? _apiKey;

  static String get baseUrl => _baseUrl ?? "";
  static String get apiKey => _apiKey ?? "";

  static Future<void> loadStoredCredentials() async {
    _baseUrl = await _storage.read(key: "server_url");
    _apiKey = await _storage.read(key: "api_key");
  }

  static Future<void> saveCredentials(String url, String key) async {
    await _storage.write(key: "server_url", value: url);
    await _storage.write(key: "api_key", value: key);
    _baseUrl = url;
    _apiKey = key;
  }
}
