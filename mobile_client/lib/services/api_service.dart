import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/file_item.dart';
import 'auth_service.dart';

class ApiService {
  static http.Client client = http.Client();

  static Map<String, String> get _headers => {
        "Authorization": "Bearer ${AuthService.apiKey}",
      };

  static Future<bool> testConnection(String url, String key) async {
    final uri = Uri.parse(url).replace(
      path: "/files",
      queryParameters: {"path": ""},
    );
    final res = await client.get(uri, headers: {"Authorization": "Bearer $key"}).timeout(const Duration(seconds: 10));
    return res.statusCode == 200;
  }

  static Future<Map<String, dynamic>> listFiles(String path) async {
    final uri = Uri.parse(AuthService.baseUrl).replace(
      path: "/files",
      queryParameters: {"path": path},
    );
    final res = await client.get(uri, headers: _headers);
    if (res.statusCode != 200) throw "Server error ${res.statusCode}";
    
    final data = jsonDecode(res.body);
    final items = (data["items"] as List).map((i) => FileItem.fromJson(i)).toList();
    return {
      "path": data["path"] ?? "",
      "items": items,
    };
  }

  static Future<void> uploadFile(File file, String targetPath) async {
    final uri = Uri.parse("${AuthService.baseUrl}/upload").replace(queryParameters: {"path": targetPath});
    final request = http.MultipartRequest('POST', uri);
    request.headers.addAll(_headers);
    request.files.add(await http.MultipartFile.fromPath('file', file.path));

    final res = await client.send(request);
    if (res.statusCode != 200) throw "Upload failed: ${res.statusCode}";
  }

  static Future<void> deleteItem(String name, String path) async {
    final uri = Uri.parse("${AuthService.baseUrl}/files").replace(
      queryParameters: {
        "name": name,
        "path": path,
      },
    );
    final res = await client.delete(uri, headers: _headers);
    if (res.statusCode != 200) throw "Delete failed: ${res.statusCode}";
  }

  static Future<void> renameItem(String oldName, String newName, String path) async {
    final uri = Uri.parse("${AuthService.baseUrl}/rename").replace(
      queryParameters: {
        "old_name": oldName,
        "new_name": newName,
        "path": path,
      },
    );
    final res = await client.put(uri, headers: _headers);
    if (res.statusCode != 200) throw "Rename failed: ${res.statusCode}";
  }

  static Future<void> createFolder(String name, String path) async {
    final uri = Uri.parse("${AuthService.baseUrl}/mkdir").replace(
      queryParameters: {
        "name": name,
        "path": path,
      },
    );
    final res = await client.post(uri, headers: _headers);
    if (res.statusCode != 200) throw "Create folder failed: ${res.statusCode}";
  }

  static Future<void> downloadFile(String filePath, String savePath) async {
    final url = Uri.parse("${AuthService.baseUrl}/files/$filePath");
    final res = await client.get(url, headers: _headers);
    if (res.statusCode != 200) throw "Server error ${res.statusCode}";

    final file = File(savePath);
    await file.writeAsBytes(res.bodyBytes);
  }
}
