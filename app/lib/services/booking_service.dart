import 'package:car_wash/models/booking.dart';
import 'package:car_wash/services/service_manager.dart';
import 'package:car_wash/utils/model_mapper.dart';

class BookingService {
  static final BookingService _instance = BookingService._internal();

  // Service managers for different endpoints
  final ServiceManager _customerManager = ServiceManager('/customer/bookings');

  // Model mapper for transforming responses
  final ModelMapper<Booking> _mapper =
      ModelMapper<Booking>((json) => Booking.fromJson(json));

  // Singleton pattern
  factory BookingService() => _instance;
  BookingService._internal();

  // Customer methods
  Future<Map<String, dynamic>> getCustomerBookings({String? status}) async {
    final queryParams = status != null ? {'status': status} : null;
    final response =
        await _customerManager.getAll(queryParameters: queryParams);
    return _mapper.transformResponse(response);
  }

  Future<Map<String, dynamic>> createBooking(String serviceId,
      {bool useBalance = false}) async {
    final response = await _customerManager.create({
      'serviceId': serviceId,
      'useBalance': useBalance,
    });
    return response; // API client already handles success/error responses
  }

  Future<Map<String, dynamic>> verifyBookingOTP(String otp) async {
    final response = await _customerManager.create(
      {'otp': otp},
      path: 'verify',
    );
    return response;
  }
}
