import 'package:get/get.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/purchase_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';

class PurchaseMasterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<PurchaseModel> purchases = <PurchaseModel>[].obs;
  final RxList<PurchaseModel> filtered = <PurchaseModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString typeFilter = 'all'.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadPurchases();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
    ever(typeFilter, (_) => _filter());
  }

  Future<void> loadPurchases() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      purchases.value = await _api.getPurchases();
      _filter();
    } catch (e) {
      errorMessage.value = 'Unable to load purchases';
    }
    isLoading.value = false;
  }

  void _filter() {
    var list = purchases.toList();
    if (searchQuery.value.isNotEmpty) {
      final q = searchQuery.value.toLowerCase();
      list = list
          .where(
            (p) =>
                p.purchaseNo.toLowerCase().contains(q) ||
                (p.supplierName?.toLowerCase().contains(q) ?? false),
          )
          .toList();
    }
    if (typeFilter.value != 'all') {
      list = list
          .where(
            (p) =>
                p.purchaseType.toLowerCase() == typeFilter.value.toLowerCase(),
          )
          .toList();
    }
    filtered.value = list;
  }

  Future<void> deletePurchase(String id) async {
    try {
      await _api.deletePurchase(id);
      purchases.removeWhere((p) => p.id == id);
      _filter();
      AppSnackbar.success('Purchase deleted');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}
