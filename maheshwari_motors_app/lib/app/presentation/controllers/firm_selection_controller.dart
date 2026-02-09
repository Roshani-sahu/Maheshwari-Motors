import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/firm_model.dart';
import '../../data/services/api_service.dart';
import 'auth_controller.dart';

class FirmSelectionController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final AuthController auth = Get.find<AuthController>();

  final RxList<FirmModel> firms = <FirmModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString error = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadFirms();
  }

  Future<void> loadFirms() async {
    isLoading.value = true;
    error.value = '';
    try {
      firms.value = await _api.getFirms();
    } catch (e) {
      error.value = ApiClient.parseError(e);
    }
    isLoading.value = false;
  }
}
