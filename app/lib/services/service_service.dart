import 'package:car_wash/models/service.dart';
import 'package:car_wash/services/service_manager.dart';
import 'package:car_wash/utils/model_mapper.dart';

class ServiceService {
  final ServiceManager _publicManager = ServiceManager('/customer/services');
  final ModelMapper<Service> _mapper =
      ModelMapper<Service>((json) => Service.fromJson(json));

  // Public methods
  Future<Map<String, dynamic>> getPublicServices() async {
    final response = await _publicManager.getAll();
    return _mapper.transformResponse(response);
  }
}
