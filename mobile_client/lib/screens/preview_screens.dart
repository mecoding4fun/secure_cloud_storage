import 'dart:io';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:http/http.dart' as http;
import '../utils/constants.dart';
import '../services/auth_service.dart';

// --------------------- IMAGE VIEW ---------------------
class ImageView extends StatelessWidget {
  final String url;
  const ImageView(this.url, {super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(backgroundColor: Colors.black, elevation: 0),
      body: Center(
        child: InteractiveViewer(
          child: Image.network(
            url,
            headers: {"Authorization": "Bearer ${AuthService.apiKey}"},
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child; 
              return const Center(
                child: CircularProgressIndicator(color: cAccent, strokeWidth: 2),
              );
            },
            errorBuilder: (ctx, obj, stack) =>
                const Icon(Icons.broken_image, color: cTextDim, size: 60),
          ),
        ),
      ),
    );
  }
}

// --------------------- PDF VIEW ---------------------
class PdfViewScreen extends StatefulWidget {
  final String url;
  final String name;

  const PdfViewScreen({super.key, required this.url, required this.name});

  @override
  State<PdfViewScreen> createState() => _PdfViewScreenState();
}

class _PdfViewScreenState extends State<PdfViewScreen> {
  String? localPath;

  @override
  void initState() {
    super.initState();
    loadPdf();
  }

  Future<void> loadPdf() async {
    try {
      final res = await http.get(Uri.parse(widget.url), headers: {"Authorization": "Bearer ${AuthService.apiKey}"});
      final bytes = res.bodyBytes;

      final dir = await getTemporaryDirectory();
      final file = File("${dir.path}/${widget.name}");
      await file.writeAsBytes(bytes);

      setState(() => localPath = file.path);
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text("Failed to load PDF: $e")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.name), backgroundColor: cBgElev),
      body: localPath == null
          ? const Center(child: CircularProgressIndicator(color: cAccent))
          : PDFView(filePath: localPath!),
    );
  }
}

// ---------------------- VIDEO VIEW ----------------------
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
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url), httpHeaders: {"Authorization": "Bearer ${AuthService.apiKey}"})
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
      appBar: AppBar(title: Text(widget.name), backgroundColor: Colors.black),
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
                      colors: const VideoProgressColors(playedColor: cAccent),
                    ),
                  ],
                ),
              )
            : const CircularProgressIndicator(color: cAccent),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: cAccent,
        foregroundColor: Colors.black,
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

// --------------------- TEXT VIEW ---------------------
class TextViewScreen extends StatefulWidget {
  final String url;
  final String name;
  const TextViewScreen({super.key, required this.url, required this.name});
  @override
  State<TextViewScreen> createState() => _TextViewScreenState();
}

class _TextViewScreenState extends State<TextViewScreen> {
  String? content;
  String? error;

  @override
  void initState() {
    super.initState();
    loadText();
  }

  Future<void> loadText() async {
    try {
      final res = await http.get(Uri.parse(widget.url), headers: {"Authorization": "Bearer ${AuthService.apiKey}"});
      if(res.statusCode == 200) {
        setState(() => content = res.body);
      } else {
        setState(() => error = "Server error: ${res.statusCode}");
      }
    } catch(e) {
      setState(() => error = "Failed to load: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: cBg,
      appBar: AppBar(title: Text(widget.name), backgroundColor: cBgElev),
      body: content == null && error == null
        ? const Center(child: CircularProgressIndicator(color: cAccent))
        : error != null
          ? Center(child: Text(error!, style: const TextStyle(color: cDanger)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Text(content!, style: const TextStyle(color: cText, fontFamily: 'monospace')),
            ),
    );
  }
}

// --------------------- FALLBACK VIEW ---------------------
class FallbackViewScreen extends StatelessWidget {
  final String url;
  final String name;
  final String ext;
  const FallbackViewScreen({super.key, required this.url, required this.name, required this.ext});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: cBg,
      appBar: AppBar(title: Text(name), backgroundColor: cBgElev),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.insert_drive_file, size: 80, color: cTextDim),
            const SizedBox(height: 20),
            Text("No in-app preview available for .$ext files.", style: const TextStyle(color: cText, fontSize: 16)),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () async {
                 ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Downloading...")));
                 try {
                   var p = await Permission.storage.request();
                   if(!p.isGranted) p = await Permission.manageExternalStorage.request();
                   if(!p.isGranted) throw "Storage permission denied";

                   final res = await http.get(Uri.parse(url), headers: {"Authorization": "Bearer ${AuthService.apiKey}"});
                   final downloadsPath = "/storage/emulated/0/Download";
                   final savePath = "$downloadsPath/$name";
                   final file = File(savePath);
                   await file.writeAsBytes(res.bodyBytes);
                   ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Saved to Downloads/$name")));
                 } catch(e) {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Download failed"), backgroundColor: cDanger));
                 }
              },
              icon: const Icon(Icons.download, color: Colors.black),
              label: const Text("Download File"),
              style: ElevatedButton.styleFrom(backgroundColor: cAccent, foregroundColor: Colors.black),
            )
          ],
        ),
      ),
    );
  }
}
