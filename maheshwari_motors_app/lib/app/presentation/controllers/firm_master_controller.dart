import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/firm_model.dart';
import '../../data/services/api_service.dart';
import '../shared/widgets/common_widgets.dart';

class FirmMasterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final RxList<FirmModel> firms = <FirmModel>[].obs;
  final RxList<FirmModel> filteredFirms = <FirmModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadFirms();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
  }

  Future<void> loadFirms() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      firms.value = await _api.getFirms();
      _filter();
    } catch (e) {
      errorMessage.value = 'Failed to load firms';
    }
    isLoading.value = false;
  }

  void _filter() {
    if (searchQuery.value.isEmpty) {
      filteredFirms.value = firms.toList();
    } else {
      filteredFirms.value = firms
          .where(
            (f) =>
                f.name.toLowerCase().contains(searchQuery.value.toLowerCase()),
          )
          .toList();
    }
  }

  Future<void> deleteFirm(String id) async {
    try {
      await _api.deleteFirm(id);
      firms.removeWhere((f) => f.id == id);
      _filter();
      AppSnackbar.success('Firm deleted');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}
