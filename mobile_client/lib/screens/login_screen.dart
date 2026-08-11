import 'dart:ui';
import 'package:flutter/material.dart';
import '../utils/constants.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import 'file_browser_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final ipCtrl = TextEditingController();
  final keyCtrl = TextEditingController();

  bool loading = false;
  String? error;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _loadStoredCredentials();
  }

  Future<void> _loadStoredCredentials() async {
    try {
      await AuthService.loadStoredCredentials();
      if (AuthService.baseUrl.isNotEmpty) ipCtrl.text = AuthService.baseUrl;
      if (AuthService.apiKey.isNotEmpty) keyCtrl.text = AuthService.apiKey;
    } catch (e) {
      // Ignore
    } finally {
      if (mounted) {
        setState(() { _initialized = true; });
      }
    }
  }

  Future<void> connect() async {
    final baseUrl = ipCtrl.text.trim();
    final apiKey  = keyCtrl.text.trim();

    setState(() { loading = true; error = null; });

    try {
      final success = await ApiService.testConnection(baseUrl, apiKey);
      if (success) {
        await AuthService.saveCredentials(baseUrl, apiKey);
        if (!mounted) return;
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const FileBrowserScreen()),
        );
      } else {
        if (mounted) setState(() => error = "Server responded with error");
      }
    } catch (e) {
      if (mounted) setState(() => error = "Connection failed");
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) {
      return const Scaffold(backgroundColor: cBg, body: Center(child: CircularProgressIndicator(color: cAccent)));
    }
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0F172A), Color(0xFF1E1B4B)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                child: Container(
                  width: 360,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: cAccent.withOpacity(0.1),
                        ),
                        child: const Icon(Icons.cloud_done_rounded, size: 48, color: cAccent),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        "Holla server",
                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: cText, letterSpacing: 1.2),
                      ),
                      const SizedBox(height: 8),
                      const Text("Secure personal storage", style: TextStyle(color: cTextDim)),
                      const SizedBox(height: 40),
                      TextField(
                        controller: ipCtrl,
                        style: const TextStyle(color: cText),
                        decoration: InputDecoration(
                          labelText: "Server URL",
                          labelStyle: const TextStyle(color: cTextDim),
                          prefixIcon: const Icon(Icons.link, color: cTextDim),
                          filled: true,
                          fillColor: Colors.black.withOpacity(0.2),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: keyCtrl,
                        obscureText: true,
                        style: const TextStyle(color: cText),
                        decoration: InputDecoration(
                          labelText: "API Key",
                          labelStyle: const TextStyle(color: cTextDim),
                          prefixIcon: const Icon(Icons.vpn_key_rounded, color: cTextDim),
                          filled: true,
                          fillColor: Colors.black.withOpacity(0.2),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                      ),
                      const SizedBox(height: 24),
                      if (error != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: Text(error!, style: const TextStyle(color: cDanger, fontWeight: FontWeight.bold)),
                        ),
                      SizedBox(
                        width: double.infinity,
                        height: 54,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: cAccent,
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 8,
                            shadowColor: cAccent.withOpacity(0.5),
                          ),
                          onPressed: loading ? null : connect,
                          child: loading
                              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2.5))
                              : const Text("Connect", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        ),
                      )
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
