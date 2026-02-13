import 'package:get/get.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/challan_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';

class ChallanListController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<ChallanModel> challans = <ChallanModel>[].obs;
  final RxList<ChallanModel> filtered = <ChallanModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString typeFilter = 'all'.obs;
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
      challans.value = await _api.getChallans();
      _filter();
    } catch (e) {
      errorMessage.value = 'Failed to load challans';
    }
    isLoading.value = false;
  }

  void _filter() {
    var list = challans.toList();

    if (typeFilter.value == 'GST') {
      list = list.where((c) => c.isGst == 1).toList();
    } else if (typeFilter.value == 'NON_GST') {
      list = list.where((c) => c.isGst == 0).toList();
    }

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
      await _api.deleteChallan(id);
      challans.removeWhere((c) => c.id == id);
      _filter();
      AppSnackbar.success('Challan deleted');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}
