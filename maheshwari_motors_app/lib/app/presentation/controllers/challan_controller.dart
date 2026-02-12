import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/challan_model.dart';
import '../../data/services/api_service.dart';
import '../shared/widgets/common_widgets.dart';
import 'auth_controller.dart';

class ChallanListController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final AuthController _auth = Get.find<AuthController>();

  final RxList<ChallanModel> challans = <ChallanModel>[].obs;
  final RxList<ChallanModel> filtered = <ChallanModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString typeFilter = 'all'.obs; // 'all', 'GST', 'NON_GST'
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadChallans();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
    ever(typeFilter, (_) => _filter());
  }

  Future<void> loadChallans() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final firmId = _auth.firmId;
      if (firmId.isNotEmpty) {
        challans.value = await _api.getChallans(firmId);
        _filter();
      }
    } catch (e) {
      errorMessage.value = 'Failed to load challans';
    }
    isLoading.value = false;
  }

  void _filter() {
    var list = challans.toList();

    // Filter by type
    if (typeFilter.value == 'GST') {
      list = list.where((c) => c.isGst == 1).toList();
    } else if (typeFilter.value == 'NON_GST') {
      list = list.where((c) => c.isGst == 0).toList();
    }

    // Filter by search
    if (searchQuery.value.isNotEmpty) {
      final q = searchQuery.value.toLowerCase();
      list = list
          .where(
            (c) =>
                c.challanNo.toLowerCase().contains(q) ||
                (c.partyName?.toLowerCase().contains(q) ?? false),
          )
          .toList();
    }
    filtered.value = list;
  }

  Future<void> deleteChallan(String id) async {
    try {
      await _api.deleteChallan(_auth.firmId, id);
      challans.removeWhere((c) => c.id == id);
      _filter();
      AppSnackbar.success('Challan deleted');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}
