// lib/services/auth_service.dart (Updated for Lab System)
import 'package:flutter/foundation.dart';
import 'package:lab_system/services/api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  final ApiClient _apiClient = ApiClient();

  // Auth state
  bool _isAuthenticated = false;
  String? _token;
  Map<String, dynamic>? _user;

  // Getters
  bool get isAuthenticated => _isAuthenticated;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;

  // Auth state notifier
  final ValueNotifier<bool> authStateChanges = ValueNotifier<bool>(false);

  // Singleton pattern
  factory AuthService() => _instance;

  AuthService._internal();

  Future<void> initialize() async {
    await _loadFromStorage();
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final tokenStr = prefs.getString('token');
      final userStr = prefs.getString('user');

      if (tokenStr != null && userStr != null) {
        _token = tokenStr;
        _apiClient.setToken(tokenStr);
        _user = jsonDecode(userStr);
        _isAuthenticated = true;
        authStateChanges.value = true;
      }
    } catch (e) {
      await _clearAuth();
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _apiClient.request(
      method: 'POST',
      path: '/auth/login',
      data: {
        'email': email,
        'password': password,
      },
    );

    if (response['success'] && response['data'] != null) {
      final userData = response['data']['user'];
      final token = response['data']['token'];

      await _handleSuccessfulAuth(token, userData);
    }

    return response;
  }

  Future<Map<String, dynamic>> logout() async {
    await _clearAuth();
    return {
      'success': true,
      'message': 'Logged out successfully',
    };
  }

  Future<void> _handleSuccessfulAuth(String token, Map<String, dynamic> user) async {
    _token = token;
    _user = user;
    _isAuthenticated = true;

    _apiClient.setToken(token);

    await _saveToStorage();
    authStateChanges.value = true;
  }

  Future<void> _saveToStorage() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', _token!);
    await prefs.setString('user', jsonEncode(_user!));
  }

  Future<void> _clearAuth() async {
    _token = null;
    _user = null;
    _isAuthenticated = false;

    _apiClient.clearToken();

    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    authStateChanges.value = false;
  }
}
