import 'package:get/get.dart';
import '../../data/models/supplier_model.dart';
import '../../data/services/api_service.dart';

class SupplierMasterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final RxList<SupplierModel> suppliers = <SupplierModel>[].obs;
  final RxBool isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    fetchSuppliers();
  }

  Future<void> fetchSuppliers() async {
    try {
      isLoading.value = true;
      suppliers.value = await _api.getSuppliers();
    } catch (e) {
      Get.snackbar('Error', e.toString());
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> deleteSupplier(String id) async {
    try {
      await _api.deleteSupplier(id);
      suppliers.removeWhere((e) => e.id == id);
      Get.snackbar('Success', 'Supplier deleted successfully');
    } catch (e) {
      Get.snackbar('Error', e.toString());
    }
  }
}
