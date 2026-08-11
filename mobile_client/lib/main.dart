import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'utils/constants.dart';

void main() {
  runApp(const RemoteFileApp());
}

class RemoteFileApp extends StatelessWidget {
  const RemoteFileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        scaffoldBackgroundColor: cBg,
        appBarTheme: const AppBarTheme(
          backgroundColor: cBgElev,
          foregroundColor: cText,
          elevation: 0,
        ),
        colorScheme: const ColorScheme.dark(
          primary: cAccent,
          surface: cBgElev,
          background: cBg,
          error: cDanger,
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(foregroundColor: cAccent),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: cAccent,
            foregroundColor: Colors.black,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
          ),
        ),
      ),
      home: const LoginScreen(),
    );
  }
}
