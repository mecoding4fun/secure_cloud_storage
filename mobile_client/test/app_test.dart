import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:remote_file_client/main.dart';
import 'package:remote_file_client/services/api_service.dart';
import 'package:remote_file_client/services/auth_service.dart';
import 'package:remote_file_client/screens/file_browser_screen.dart';

void main() {
  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
  });

  testWidgets('App starts and shows LoginScreen', (WidgetTester tester) async {
    await tester.pumpWidget(const RemoteFileApp());
    await tester.pumpAndSettle();

    expect(find.text('Holla server'), findsOneWidget);
    expect(find.text('Server URL'), findsOneWidget);
    expect(find.text('API Key'), findsOneWidget);
    expect(find.text('Connect'), findsOneWidget);
  });

  testWidgets('Login failure shows error message', (WidgetTester tester) async {
    ApiService.client = MockClient((request) async {
      return http.Response('Unauthorized', 401);
    });

    await tester.pumpWidget(const RemoteFileApp());
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).first, 'http://test.local');
    await tester.enterText(find.byType(TextField).last, 'badkey');
    await tester.tap(find.text('Connect'));
    await tester.pumpAndSettle();

    expect(find.text('Server responded with error'), findsOneWidget);
  });

  testWidgets('Successful login navigates to file browser', (WidgetTester tester) async {
    ApiService.client = MockClient((request) async {
      if (request.url.path == '/files') {
        if (request.url.queryParameters['path'] == '') {
          return http.Response(jsonEncode({
            "path": "",
            "items": [
              {"name": "folder1", "is_dir": true, "size": 0, "modified": 0.0},
              {"name": "file.txt", "is_dir": false, "size": 1024, "modified": 0.0}
            ]
          }), 200);
        }
      }
      return http.Response('Not Found', 404);
    });

    await tester.pumpWidget(const RemoteFileApp());
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).first, 'http://test.local');
    await tester.enterText(find.byType(TextField).last, 'goodkey');
    await tester.tap(find.text('Connect'));
    
    // Pump frames to let animations and async navigation finish
    await tester.pumpAndSettle();

    // Now we should be on FileBrowserScreen
    expect(find.byType(FileBrowserScreen), findsOneWidget);
    
    // It should render the mocked items
    expect(find.text('folder1'), findsOneWidget);
    expect(find.text('file.txt'), findsOneWidget);
    expect(find.text('1.0 KB'), findsOneWidget); // size formatted
  });
}
