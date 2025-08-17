// lib/main.dart (Updated for Lab System)
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lab/providers/auth_provider.dart';
import 'package:lab/screens/login_screen.dart';
import 'package:lab/screens/dashboard_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [ChangeNotifierProvider(create: (_) => AuthProvider())],
      child: MaterialApp(
        title: 'Lab System',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
          useMaterial3: true,
        ),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/dashboard': (context) => const DashboardScreen(),
        },
        initialRoute: '/login',
      ),
    );
  }
}
