import 'package:get/get.dart';
import '../network/api_client.dart';
import '../../data/services/api_service.dart';
import '../../presentation/controllers/auth_controller.dart';

class InitialBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(ApiClient(), permanent: true);
    Get.put(ApiService(), permanent: true);
    Get.put(AuthController(), permanent: true);
  }
}
