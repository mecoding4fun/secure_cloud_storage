import 'package:flutter_test/flutter_test.dart';
import 'package:remote_file_client/models/file_item.dart';

void main() {
  group('FileItem tests', () {
    test('fromJson parses correctly', () {
      final json = {
        "name": "document.txt",
        "is_dir": false,
        "size": 1024,
        "modified": 1612345678.0
      };

      final item = FileItem.fromJson(json);

      expect(item.name, "document.txt");
      expect(item.isDir, false);
      expect(item.size, 1024);
      expect(item.modified, 1612345678.0);
    });

    test('fromJson handles null size', () {
      final json = {
        "name": "folder",
        "is_dir": true,
      };

      final item = FileItem.fromJson(json);

      expect(item.name, "folder");
      expect(item.isDir, true);
      expect(item.size, 0); // Default to 0
      expect(item.modified, 0.0);
    });
  });
}
