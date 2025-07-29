import 'package:car_wash/models/service.dart';
import 'package:car_wash/models/user.dart';

class Booking {
  final String id;
  final String customerId;
  final String serviceId;
  final double amount;
  final String status;
  final String? key;
  final DateTime createdAt;
  final Service? service;
  final User? customer;

  Booking({
    required this.id,
    required this.customerId,
    required this.serviceId,
    required this.amount,
    required this.status,
    this.key,
    required this.createdAt,
    this.service,
    this.customer,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['_id'],
      customerId: json['customerId'] is Map
          ? json['customerId']['_id']
          : json['customerId'],
      serviceId: json['serviceId'] is Map
          ? json['serviceId']['_id']
          : json['serviceId'],
      amount: json['amount'].toDouble(),
      status: json['status'],
      key: json['key'],
      createdAt: DateTime.parse(json['createdAt']),
      service:
          json['serviceId'] is Map ? Service.fromJson(json['serviceId']) : null,
      customer:
          json['customerId'] is Map ? User.fromJson(json['customerId']) : null,
    );
  }
}
