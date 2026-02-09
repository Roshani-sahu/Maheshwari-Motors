import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import '../network/api_client.dart';
import '../../data/services/api_service.dart';
import '../../presentation/controllers/auth_controller.dart';

class InitialBinding extends Bindings {
  @override
  void dependencies() {
    debugPrint('=== BINDING: creating ApiClient ===');
    Get.put(ApiClient(), permanent: true);
    debugPrint('=== BINDING: creating ApiService ===');
    Get.put(ApiService(), permanent: true);
    debugPrint('=== BINDING: creating AuthController ===');
    Get.put(AuthController(), permanent: true);
    debugPrint('=== BINDING: all done ===');
  }
}
