import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/bill_model.dart';
import '../../data/services/api_service.dart';
import '../shared/widgets/common_widgets.dart';
import 'auth_controller.dart';

class BillListController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final AuthController _auth = Get.find<AuthController>();

  final RxList<BillModel> bills = <BillModel>[].obs;
  final RxList<BillModel> filtered = <BillModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString statusFilter = 'all'.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadBills();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
    ever(statusFilter, (_) => _filter());
  }

  Future<void> loadBills() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final firmId = _auth.firmId;
      if (firmId.isNotEmpty) {
        bills.value = await _api.getBills(firmId);
        _filter();
      }
    } catch (e) {
      errorMessage.value = 'Failed to load bills';
    }
    isLoading.value = false;
  }

  void _filter() {
    var list = bills.toList();
    if (searchQuery.value.isNotEmpty) {
      final q = searchQuery.value.toLowerCase();
      list = list
          .where(
            (b) =>
                b.billNo.toLowerCase().contains(q) ||
                (b.partyName?.toLowerCase().contains(q) ?? false),
          )
          .toList();
    }
    if (statusFilter.value != 'all') {
      list = list
          .where(
            (b) =>
                b.paymentStatus.toLowerCase() ==
                statusFilter.value.toLowerCase(),
          )
          .toList();
    }
    filtered.value = list;
  }

  Future<void> deleteBill(String id) async {
    try {
      await _api.deleteBill(_auth.firmId, id);
      bills.removeWhere((b) => b.id == id);
      _filter();
      AppSnackbar.success('Bill deleted');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}
