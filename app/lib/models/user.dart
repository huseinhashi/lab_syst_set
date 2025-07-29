class User {
  final String id;
  final String name;
  final String phone;
  final int balance;

  User({
    required this.id,
    required this.name,
    required this.phone,
    this.balance = 0,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      phone: json['phone'],
      balance: json['balance'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'balance': balance,
    };
  }

  String get balanceInDollars {
    return (balance / 100).toStringAsFixed(2);
  }
}
