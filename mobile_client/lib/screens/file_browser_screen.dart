import 'dart:ui';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:open_filex/open_filex.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';

import '../utils/constants.dart';
import '../models/file_item.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import 'preview_screens.dart';

class FileBrowserScreen extends StatefulWidget {
  const FileBrowserScreen({super.key});

  @override
  State<FileBrowserScreen> createState() => _FileBrowserScreenState();
}

class _FileBrowserScreenState extends State<FileBrowserScreen> {
  List<FileItem> items = [];
  String path = "";
  bool loading = false;
  Set<String> selectedItems = {};

  @override
  void initState() {
    super.initState();
    load("");
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(color: Colors.white)),
        backgroundColor: isError ? cDanger : const Color(0xFF3EC487),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  Future<void> load([String p = ""]) async {
    setState(() => loading = true);
    try {
      final data = await ApiService.listFiles(p);
      setState(() {
        items = data["items"] as List<FileItem>;
        path = data["path"] as String;
        loading = false;
        selectedItems.clear();
      });
    } catch (e) {
      setState(() => loading = false);
      _showToast("Failed to load folder", isError: true);
    }
  }

  Future<void> download(String filePath) async {
    try {
      _showToast("Downloading ${filePath.split('/').last}...");
      var permission = await Permission.storage.request();
      if (!permission.isGranted) {
        permission = await Permission.manageExternalStorage.request();
      }
      if (!permission.isGranted) {
        await openAppSettings();
        throw "Storage permission denied";
      }

      final filename = filePath.split("/").last;
      final savePath = "/storage/emulated/0/Download/$filename";
      await ApiService.downloadFile(filePath, savePath);

      _showToast("Saved to Downloads → $savePath");
      OpenFilex.open(savePath);
    } catch (e) {
      _showToast("Download failed", isError: true);
    }
  }

  Future<void> uploadFile(File file) async {
    try {
      _showToast("Uploading ${file.path.split('/').last}...");
      await ApiService.uploadFile(file, path);
      load(path);
    } catch (e) {
      _showToast("Upload failed", isError: true);
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

  Future<void> deleteItems(List<String> names) async {
    if(names.isEmpty) return;
    try {
      for(var name in names) {
        await ApiService.deleteItem(name, path);
      }
      _showToast("Deleted ${names.length} item(s)");
      selectedItems.clear();
      await load(path);
    } catch (e) {
      _showToast("Delete failed", isError: true);
    }
  }

  Future<void> renameItem(String oldName, String newName) async {
    try {
      await ApiService.renameItem(oldName, newName, path);
      _showToast("Renamed $oldName");
      await load(path);
    } catch(e) {
       _showToast("Rename failed", isError: true);
    }
  }

  Future<void> createFolder(String name) async {
    try {
      await ApiService.createFolder(name, path);
      _showToast("Created folder $name");
      await load(path);
    } catch(e) {
       _showToast("Create folder failed", isError: true);
    }
  }

  String full(String name) => path.isEmpty ? name : "$path/$name";

  void showRenameDialog(String oldName) {
    final ctrl = TextEditingController(text: oldName);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: cBgElev,
        title: const Text("Rename"),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(border: OutlineInputBorder()),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel", style: TextStyle(color: cTextDim))),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              if(ctrl.text.trim().isNotEmpty && ctrl.text != oldName) {
                renameItem(oldName, ctrl.text.trim());
              }
            },
            child: const Text("Save"),
          ),
        ],
      ),
    );
  }

  void showNewFolderDialog() {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: cBgElev,
        title: const Text("New Folder"),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(border: OutlineInputBorder(), hintText: "Folder name"),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel", style: TextStyle(color: cTextDim))),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              if(ctrl.text.trim().isNotEmpty) {
                createFolder(ctrl.text.trim());
              }
            },
            child: const Text("Create"),
          ),
        ],
      ),
    );
  }

  void openFile(BuildContext ctx, String filePath) {
    final ext = filePath.split(".").last.toLowerCase();

    final imageExts = ["png","jpg","jpeg","webp","gif","dng","nef","cr2","arw","orf","rw2","pef","raf","srw","tif","tiff","heic","heif","avif","raw","bmp","ico","svg"];
    final videoExts = ["mp4","mkv","mov","webm"];
    final audioExts = ["mp3","wav","m4a","aac","flac","ogg"];
    final textExts = ["txt","md","log","json","yml","yaml","xml","csv","tsv"];

    if (imageExts.contains(ext)) {
      Navigator.push(ctx, MaterialPageRoute(builder: (_) => ImageView("${AuthService.baseUrl}/files/$filePath")));
      return;
    }

    if (videoExts.contains(ext) || audioExts.contains(ext)) {
      final encodedPath = filePath.split("/").map(Uri.encodeComponent).join("/");
      final url = "${AuthService.baseUrl}/stream/$encodedPath";
      Navigator.push(ctx, MaterialPageRoute(builder: (_) => VideoView(url: url, name: filePath.split('/').last)));
      return;
    }

    if (["pdf"].contains(ext)) {
      final encodedPath = filePath.split("/").map(Uri.encodeComponent).join("/");
      final url = "${AuthService.baseUrl}/files/$encodedPath";
      Navigator.push(ctx, MaterialPageRoute(builder: (_) => PdfViewScreen(url: url, name: filePath.split('/').last)));
      return;
    }

    if (textExts.contains(ext)) {
      final url = "${AuthService.baseUrl}/files/$filePath";
      Navigator.push(ctx, MaterialPageRoute(builder: (_) => TextViewScreen(url: url, name: filePath.split('/').last)));
      return;
    }

    final url = "${AuthService.baseUrl}/files/$filePath";
    Navigator.push(ctx, MaterialPageRoute(builder: (_) => FallbackViewScreen(url: url, name: filePath.split('/').last, ext: ext)));
  }

  void showUploadSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: cBgElev,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(14))),
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.photo, color: cAccent),
            title: const Text("Upload from Gallery", style: TextStyle(color: cText)),
            onTap: () { Navigator.pop(context); uploadFromGallery(); },
          ),
          ListTile(
            leading: const Icon(Icons.camera_alt, color: cAccent),
            title: const Text("Take Photo", style: TextStyle(color: cText)),
            onTap: () { Navigator.pop(context); uploadFromCamera(); },
          ),
          ListTile(
            leading: const Icon(Icons.attach_file, color: cAccent),
            title: const Text("Upload Files", style: TextStyle(color: cText)),
            onTap: () { Navigator.pop(context); pickFilesAndUpload(); },
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  String formatBytes(int bytes) {
    if (bytes == 0) return "0 B";
    if (bytes < 1024) return "$bytes B";
    if (bytes < 1024 * 1024) return "${(bytes / 1024).toStringAsFixed(1)} KB";
    if (bytes < 1024 * 1024 * 1024) return "${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB";
    return "${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB";
  }

  @override
  Widget build(BuildContext context) {
    List<FileItem> visibleItems = items.where((i) => !i.name.startsWith("._")).toList();
    visibleItems.sort((a, b) {
      if (a.isDir != b.isDir) return a.isDir ? -1 : 1;
      return a.name.compareTo(b.name);
    });

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.black.withOpacity(0.4),
        elevation: 0,
        flexibleSpace: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(color: Colors.transparent),
          ),
        ),
        title: Row(
          children: [
            const Icon(Icons.cloud, color: cAccent),
            const SizedBox(width: 12),
            Text(path.isEmpty ? "Holla server" : path.split('/').last, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 20, letterSpacing: 0.5)),
          ],
        ),
        actions: [
          if(selectedItems.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep_rounded, color: cDanger),
              onPressed: () => deleteItems(selectedItems.toList()),
            ),
          IconButton(icon: const Icon(Icons.create_new_folder_rounded, color: Colors.white), onPressed: showNewFolderDialog),
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: cAccent.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.upload_rounded, color: cAccent, size: 20),
            ),
            onPressed: showUploadSheet,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0F172A), Color(0xFF1E1B4B)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: loading
              ? const Center(child: CircularProgressIndicator(color: cAccent))
              : Column(
                  children: [
                    if (path.isNotEmpty)
                      InkWell(
                        onTap: () {
                          final parts = path.split("/");
                          load(parts.length > 1 ? parts.sublist(0, parts.length - 1).join("/") : "");
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                          decoration: BoxDecoration(
                            border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
                          ),
                          child: Row(
                            children: const [
                              Icon(Icons.keyboard_backspace_rounded, size: 22, color: cAccent),
                              SizedBox(width: 12),
                              Text("Go Back", style: TextStyle(color: cAccent, fontWeight: FontWeight.bold, fontSize: 16)),
                            ],
                          ),
                        ),
                      ),
                    Expanded(
                      child: visibleItems.isEmpty 
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.folder_open_rounded, size: 64, color: Colors.white.withOpacity(0.2)),
                                const SizedBox(height: 16),
                                Text("It's empty here", style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 18, fontWeight: FontWeight.w500))
                              ],
                            )
                          )
                        : RefreshIndicator(
                            color: cAccent,
                            backgroundColor: cBgElev,
                            onRefresh: () => load(path),
                            child: ListView.builder(
                              physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              itemCount: visibleItems.length,
                              itemBuilder: (ctx, idx) {
                                final i = visibleItems[idx];
                                final name = i.name;
                                final isDir = i.isDir;
                                final sizeStr = isDir ? "—" : formatBytes(i.size);
                                final isSelected = selectedItems.contains(name);

                                return Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(16),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: isSelected ? cAccent.withOpacity(0.15) : Colors.white.withOpacity(0.03),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: isSelected ? cAccent.withOpacity(0.5) : Colors.white.withOpacity(0.05)),
                                      ),
                                      child: ListTile(
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        leading: GestureDetector(
                                          onTap: () {
                                            setState(() {
                                              if(isSelected) selectedItems.remove(name);
                                              else selectedItems.add(name);
                                            });
                                          },
                                          child: AnimatedContainer(
                                            duration: const Duration(milliseconds: 200),
                                            width: 48,
                                            height: 48,
                                            decoration: BoxDecoration(
                                              color: isSelected ? cAccent : (isDir ? Colors.indigoAccent.withOpacity(0.2) : Colors.pinkAccent.withOpacity(0.2)),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Icon(
                                              isSelected ? Icons.check_rounded : (isDir ? Icons.folder_rounded : Icons.insert_drive_file_rounded),
                                              color: isSelected ? Colors.black : (isDir ? Colors.indigoAccent : Colors.pinkAccent),
                                            ),
                                          ),
                                        ),
                                        title: Text(name, style: const TextStyle(color: cText, fontWeight: FontWeight.w600, fontSize: 16), overflow: TextOverflow.ellipsis),
                                        subtitle: Padding(
                                          padding: const EdgeInsets.only(top: 4.0),
                                          child: Text(isDir ? "Folder" : sizeStr, style: const TextStyle(color: cTextDim, fontSize: 13, fontWeight: FontWeight.w500)),
                                        ),
                                        onTap: () {
                                          if (isDir) load(full(name));
                                          else openFile(context, full(name));
                                        },
                                        trailing: PopupMenuButton<String>(
                                          icon: const Icon(Icons.more_horiz_rounded, color: cTextDim),
                                          color: cBgElev,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                          onSelected: (val) {
                                            if(val == 'download' && !isDir) download(full(name));
                                            if(val == 'rename') showRenameDialog(name);
                                            if(val == 'delete') deleteItems([name]);
                                          },
                                          itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
                                            if(!isDir)
                                              const PopupMenuItem<String>(value: 'download', child: Row(children: [Icon(Icons.download_rounded, size: 20, color: cText), SizedBox(width: 12), Text('Download')])),
                                            const PopupMenuItem<String>(value: 'rename', child: Row(children: [Icon(Icons.edit_rounded, size: 20, color: cText), SizedBox(width: 12), Text('Rename')])),
                                            const PopupMenuItem<String>(value: 'delete', child: Row(children: [Icon(Icons.delete_rounded, size: 20, color: cDanger), SizedBox(width: 12), Text('Delete', style: TextStyle(color: cDanger))])),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
