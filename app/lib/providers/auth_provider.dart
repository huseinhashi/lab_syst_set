// lib/providers/auth_provider.dart
import 'package:flutter/material.dart';
import 'package:car_wash/models/user.dart';
import 'package:car_wash/services/auth_service.dart';
import 'package:car_wash/services/balance_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final BalanceService _balanceService = BalanceService();
  bool _isLoading = false;
  String? _error;

  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _authService.isAuthenticated;
  User? get user => _authService.user;
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

  Future<bool> register(String name, String phone, String password) async {
    _setLoading(true);
    _clearError();

    final response = await _authService.register(name, phone, password);

    if (!response['success']) {
      _setError(response['message']);
    }

    _setLoading(false);
    return response['success'];
  }

  Future<bool> login(String phone, String password) async {
    _setLoading(true);
    _clearError();

    final response = await _authService.loginCustomer(phone, password);

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

  Future<bool> updateProfile({
    String? name,
    String? phone,
    String? currentPassword,
    String? newPassword,
  }) async {
    try {
      _setLoading(true);
      _clearError();

      final response = await _authService.updateProfile(
        name: name,
        phone: phone,
        currentPassword: currentPassword,
        newPassword: newPassword,
      );

      if (!response['success']) {
        _setError(response['message'] ?? 'Error updating profile');
      }

      return response['success'];
    } catch (e) {
      _setError('An error occurred while updating profile');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> refreshBalance() async {
    if (!isAuthenticated) return;

    try {
      final response = await _balanceService.getUserBalance();
      if (response['success'] && response['data'] != null) {
        final balance = response['data']['balance'] as int;
        // Update user balance in auth service
        final currentUser = _authService.user;
        if (currentUser != null) {
          final updatedUser = User(
            id: currentUser.id,
            name: currentUser.name,
            phone: currentUser.phone,
            balance: balance,
          );
          await _authService.updateUser(updatedUser);
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Error refreshing balance: $e');
    }
  }

  Future<void> checkAuth() async {
    _setLoading(true);
    _clearError();

    await _initialize();

    // Delay state update until after build completes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _setLoading(false);
    });
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
