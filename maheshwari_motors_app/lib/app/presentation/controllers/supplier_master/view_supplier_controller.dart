import 'package:get/get.dart';

import '../../../data/models/supplier_model.dart';
import '../../../data/services/api_service.dart';

class ViewSupplierController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final RxList<SupplierModel> suppliers = <SupplierModel>[].obs;
  final RxList<SupplierModel> filtered = <SupplierModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadSuppliers();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
  }

  Future<void> loadSuppliers() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      suppliers.value = await _api.getSuppliers();
      _filter();
    } catch (e) {
      errorMessage.value = 'Failed to load suppliers';
    }
    isLoading.value = false;
  }

  void _filter() {
    if (searchQuery.value.isEmpty) {
      filtered.value = suppliers;
    } else {
      final q = searchQuery.value.toLowerCase();
      filtered.value = suppliers
          .where(
            (s) =>
                s.name.toLowerCase().contains(q) ||
                (s.phone?.contains(q) ?? false) ||
                (s.email?.toLowerCase().contains(q) ?? false),
          )
          .toList();
    }
  }
}
