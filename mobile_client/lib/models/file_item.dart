class FileItem {
  final String name;
  final bool isDir;
  final int size;
  final double modified;

  FileItem({
    required this.name,
    required this.isDir,
    required this.size,
    required this.modified,
  });

  factory FileItem.fromJson(Map<String, dynamic> json) {
    return FileItem(
      name: json['name'] as String,
      isDir: json['is_dir'] as bool,
      size: json['size'] ?? 0,
      modified: (json['modified'] ?? 0).toDouble(),
    );
  }
}
