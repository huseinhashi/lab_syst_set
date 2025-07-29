// lib/main.dart (Updated)
import 'package:flutter/material.dart';
import 'package:car_wash/screens/auth/login_screen.dart';
import 'package:provider/provider.dart';
import 'package:car_wash/providers/auth_provider.dart';
import 'package:car_wash/screens/splash_screen.dart';
import 'package:car_wash/screens/customer/customer_dashboard.dart';
import 'package:car_wash/screens/auth/register_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'Car Wash',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
          useMaterial3: true,
        ),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/customer': (context) => const CustomerDashboard(),
        },
        initialRoute: '/',
        onGenerateRoute: (settings) {
          if (settings.name == '/') {
            return MaterialPageRoute(
              builder: (_) => const SplashScreen(),
            );
          }
          return null;
        },
      ),
    );
  }
}
