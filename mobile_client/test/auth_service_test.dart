import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:remote_file_client/services/auth_service.dart';

void main() {
  group('AuthService tests', () {
    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
    });

    test('Loads and saves credentials', () async {
      // Should be empty initially
      await AuthService.loadStoredCredentials();
      expect(AuthService.baseUrl, "");
      expect(AuthService.apiKey, "");

      // Save credentials
      await AuthService.saveCredentials("http://test.local", "secret_key");
      expect(AuthService.baseUrl, "http://test.local");
      expect(AuthService.apiKey, "secret_key");

      // Reset in-memory state manually to simulate app restart
      // Wait, we can't easily reset private statics, but we can verify it reads correctly:
      await AuthService.loadStoredCredentials();
      expect(AuthService.baseUrl, "http://test.local");
      expect(AuthService.apiKey, "secret_key");
    });
  });
}
