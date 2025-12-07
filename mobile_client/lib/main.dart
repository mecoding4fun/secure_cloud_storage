import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:open_filex/open_filex.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:video_player/video_player.dart';

const String kDefaultServerUrl = "http://YOUR_SERVER_IP:8000"; // <-- change this when self-hosting
const String kDefaultApiKey   = "YOUR_API_KEY_HERE";          // <-- must match API_KEY in server.py

void main() {
  runApp(const RemoteFileApp());
}

class RemoteFileApp extends StatelessWidget {
  const RemoteFileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: const LoginPage(),
    );
  }
}

// --------------------- LOGIN PAGE ---------------------

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final ipCtrl = TextEditingController(text: kDefaultServerUrl);
  final keyCtrl = TextEditingController(text: kDefaultApiKey);

  bool loading = false;
  String? error;

  Future<void> connect() async {
    final baseUrl = ipCtrl.text.trim();
    final apiKey  = keyCtrl.text.trim();

    setState(() => loading = true);

    try {
      final uri = Uri.parse(baseUrl).replace(
        path: "/files",
        queryParameters: {"key": apiKey, "path": ""},
      );

      final res = await http.get(uri);

      if (res.statusCode == 200) {
        if (!mounted) return;
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => FileBrowser(baseUrl, apiKey),
          ),
        );
      } else {
        setState(() => error = "Server responded ${res.statusCode}");
      }
    } catch (e) {
      setState(() => error = "Connection failed");
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xff0e0f12),
      body: Center(
        child: SizedBox(
          width: 350,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.folder_shared, size: 50),
              const SizedBox(height: 18),
              TextField(
                controller: ipCtrl,
                decoration: InputDecoration(
                  labelText: "Server URL (http://ip:8000)",
                  filled: true,
                  fillColor: Colors.grey.shade900,
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: keyCtrl,
                decoration: InputDecoration(
                  labelText: "API Key",
                  filled: true,
                  fillColor: Colors.grey.shade900,
                ),
              ),
              const SizedBox(height: 18),

              if (error != null)
                Text(error!, style: const TextStyle(color: Colors.red)),

              const SizedBox(height: 10),

              ElevatedButton(
                onPressed: loading ? null : connect,
                child: loading
                    ? const CircularProgressIndicator()
                    : const Text("Connect"),
              )
            ],
          ),
        ),
      ),
    );
  }
}

// --------------------- FILE BROWSER ---------------------

class FileBrowser extends StatefulWidget {
  final String baseUrl;
  final String apikey;

  const FileBrowser(this.baseUrl, this.apikey, {super.key});

  @override
  State<FileBrowser> createState() => _FileBrowserState();
}

class _FileBrowserState extends State<FileBrowser> {
  List items = [];
  String path = "";
  bool loading = false;

  Future<void> download(String filePath) async {
  try {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Downloading $filePath..."))
    );

    var permission = await Permission.storage.request();
    if (!permission.isGranted) {
      permission = await Permission.manageExternalStorage.request();
    }
    if (!permission.isGranted) {
      await openAppSettings();
      throw "Storage permission denied";
    }

    final url = Uri.parse("${widget.baseUrl}/files/$filePath?key=${widget.apikey}");
    final res = await http.get(url);
    if (res.statusCode != 200) throw "Server error ${res.statusCode}";

    final bytes = res.bodyBytes;

    final downloadsPath = "/storage/emulated/0/Download";
    final filename = filePath.split("/").last;
    final savePath = "$downloadsPath/$filename";

    final file = File(savePath);
    await file.writeAsBytes(bytes);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Saved to Downloads → $savePath"))
    );

    OpenFilex.open(savePath);
    
  } catch (e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Failed: $e"))
    );
  }
}
  Future<void> uploadFile(File file) async {
  try {
    final uri = Uri.parse("${widget.baseUrl}/upload?key=${widget.apikey}&path=$path");
    final request = http.MultipartRequest('POST', uri);
    request.files.add(await http.MultipartFile.fromPath('file', file.path));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Uploading ${file.path.split('/').last}...")),
    );

    final res = await request.send();
    if (res.statusCode == 200) load(path);
    else throw "Upload failed: ${res.statusCode}";
  } catch (e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Upload failed: $e")),
    );
  }
}
Future<void> uploadFromGallery() async {
    var p = await Permission.photos.request();
  if(!p.isGranted) return;
  final picker = ImagePicker();
  final List<XFile>? images = await picker.pickMultiImage();
  if (images == null || images.isEmpty) return;

  for (var img in images) {
    await uploadFile(File(img.path));
  }
}
Future<void> pickFilesAndUpload() async {
  var p = await Permission.manageExternalStorage.request();
  if (!p.isGranted) return;

  final result = await FilePicker.platform.pickFiles(allowMultiple: true);
  if (result == null) return;

  for (var file in result.files) {
    if (file.path != null) await uploadFile(File(file.path!));
  }
}
Future<void> uploadFromCamera() async {
  var p = await Permission.camera.request();
  if (!p.isGranted) return;

  final picker = ImagePicker();

  final XFile? pic = await picker.pickImage(
    source: ImageSource.camera,
    preferredCameraDevice: CameraDevice.rear,
    maxWidth: 2000,
    maxHeight: 2000,
    imageQuality: 90,
  );

  if (pic == null) return; 

  await uploadFile(File(pic.path));
}
  Future<void> deleteItem(String name) async {
    try {
      final uri = Uri.parse("${widget.baseUrl}/files").replace(
        queryParameters: {
          "name": name,
          "path": path,
          "key": widget.apikey,
        },
      );

      final res = await http.delete(uri);
      if (res.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Deleted $name")),
        );
        await load(path);
      } else {
        throw "Delete failed: ${res.statusCode}";
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Delete failed: $e")),
      );
    }
  }
  Future<void> load([String p = ""]) async {
    setState(() => loading = true);

    final uri = Uri.parse(widget.baseUrl).replace(
      path: "/files",
      queryParameters: {"key": widget.apikey, "path": p},
    );

    final res = await http.get(uri);
    final data = jsonDecode(res.body);

    setState(() {
      items = data["items"];
      path = data["path"];
      loading = false;
    });
  }

  @override
  void initState() {
    super.initState();
    load("");
  }

  String full(String name) =>
      path.isEmpty ? name : "$path/$name";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(path.isEmpty ? "/" : path),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: () => load(path)),
          IconButton(
            icon: Icon(Icons.upload),
            onPressed: showUploadSheet,
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              children: [
                if (path.isNotEmpty)
                  ListTile(
                    leading: const Icon(Icons.arrow_back),
                    title: const Text("Back"),
                    onTap: () {
                      final parts = path.split("/");
                      load(parts.length > 1
                          ? parts.sublist(0, parts.length - 1).join("/")
                          : "");
                    },
                  ),
                ...items.map((i) => ListTile(
                  leading: Text(i["is_dir"] ? "📁" : "📄", style: const TextStyle(fontSize: 24)),
                  title: Text(i["name"]),
                  onTap: () {
                    if (i["is_dir"]) load(full(i["name"]));
                    else openFile(context, full(i["name"]));
                  },
                  trailing: i["is_dir"]
                      ? null
                      : Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.download),
                              onPressed: () => download(full(i["name"])),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline),
                              onPressed: () => deleteItem(i["name"]),
                            ),
                          ],
                        ),
                )),
              ],
            ),
    );
  }

  void openFile(BuildContext ctx, String filePath) {
    final ext = filePath.split(".").last.toLowerCase();

    if (["png","jpg","jpeg","webp","gif"].contains(ext)) {
      Navigator.push(
        ctx,
        MaterialPageRoute(
          builder: (_) => ImageView("${widget.baseUrl}/files/$filePath?key=${widget.apikey}"),
        ),
      );
      return;
    }

    if (["mp4","mkv","mov","webm"].contains(ext)) {
      final encodedPath = filePath.split("/").map(Uri.encodeComponent).join("/");
      final url = "${widget.baseUrl}/stream/$encodedPath?key=${widget.apikey}";
      Navigator.push(
        ctx,
        MaterialPageRoute(
          builder: (_) => VideoView(url: url, name: filePath.split('/').last),
        ),
      );
      return;
    }

    ScaffoldMessenger.of(ctx).showSnackBar(
      const SnackBar(content: Text("Preview not implemented.")),
    );
  }
  void showUploadSheet() {
  showModalBottomSheet(
    context: context,
    backgroundColor: Color(0xFF1E1E1E),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
    ),
    builder: (_) => Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ListTile(
          leading: Icon(Icons.photo),
          title: Text("Upload from Gallery"),
          onTap: () { Navigator.pop(context); uploadFromGallery(); },
        ),
        ListTile(
          leading: Icon(Icons.camera_alt),
          title: Text("Take Photo"),
          onTap: () { Navigator.pop(context); uploadFromCamera(); },
        ),
        ListTile(
          leading: Icon(Icons.attach_file),
          title: Text("Upload Files"),
          onTap: () { Navigator.pop(context); pickFilesAndUpload(); },
        ),
      ],
    ),
  );
}
}

// --------------------- IMAGE VIEW ---------------------

class ImageView extends StatelessWidget {
  final String url;
  const ImageView(this.url, {super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(),
      body: Center(
        child: InteractiveViewer(
          child: Image.network(
            url,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child; 

              return const Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              );
            },
            errorBuilder: (ctx, obj, stack) =>
                const Icon(Icons.error, color: Colors.red, size: 60),
          ),
        ),
      ),
    );
  }
}

class VideoView extends StatefulWidget {
  final String url;
  final String name;
  const VideoView({super.key, required this.url, required this.name});

  @override
  State<VideoView> createState() => _VideoViewState();
}

class _VideoViewState extends State<VideoView> {
  late VideoPlayerController _controller;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url))
      ..initialize().then((_) {
        setState(() {
          _ready = true;
        });
        _controller.play();
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(title: Text(widget.name)),
      body: Center(
        child: _ready
            ? AspectRatio(
                aspectRatio: _controller.value.aspectRatio,
                child: Stack(
                  alignment: Alignment.bottomCenter,
                  children: [
                    VideoPlayer(_controller),
                    VideoProgressIndicator(
                      _controller,
                      allowScrubbing: true,
                    ),
                  ],
                ),
              )
            : const CircularProgressIndicator(),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          setState(() {
            _controller.value.isPlaying
                ? _controller.pause()
                : _controller.play();
          });
        },
        child: Icon(
          _controller.value.isPlaying ? Icons.pause : Icons.play_arrow,
        ),
      ),
    );
  }
}