// lib/providers/auth_provider.dart (Updated for Lab System)
import 'package:flutter/material.dart';
import 'package:lab_system/services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  bool _isLoading = false;
  String? _error;

  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _authService.isAuthenticated;
  Map<String, dynamic>? get user => _authService.user;
  String? get token => _authService.token;

  AuthProvider() {
    _initialize();
    _authService.authStateChanges.addListener(_onAuthStateChanged);
  }

  void _onAuthStateChanged() {
    notifyListeners();
  }

  Future<void> _initialize() async {
    try {
      _setLoading(true);
      await _authService.initialize();
    } finally {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _setLoading(false);
      });
    }
  }

  Future<bool> login(String email, String password) async {
    _setLoading(true);
    _clearError();

    final response = await _authService.login(email, password);

    if (!response['success']) {
      _setError(response['message']);
    }

    _setLoading(false);
    return response['success'];
  }

  Future<bool> logout() async {
    _setLoading(true);
    _clearError();

    final response = await _authService.logout();

    if (!response['success']) {
      _setError(response['message']);
    }

    _setLoading(false);
    return response['success'];
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _authService.authStateChanges.removeListener(_onAuthStateChanged);
    super.dispose();
  }
}
