import 'package:car_wash/services/service_manager.dart';

class BalanceService {
  static final BalanceService _instance = BalanceService._internal();

  // Service manager for balance endpoints
  final ServiceManager _balanceManager = ServiceManager('/customer/balance');

  // Singleton pattern
  factory BalanceService() => _instance;
  BalanceService._internal();

  // Get user balance
  Future<Map<String, dynamic>> getUserBalance() async {
    final response = await _balanceManager.getAll();
    return response;
  }
}
