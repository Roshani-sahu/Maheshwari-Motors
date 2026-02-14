import 'package:get/get.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/brand_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';

class BrandMasterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<BrandModel> brands = <BrandModel>[].obs;
  final RxList<BrandModel> filtered = <BrandModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    fetchBrands();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
  }

  Future<void> fetchBrands() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      brands.value = await _api.getBrands();
      _filter();
    } catch (e) {
      errorMessage.value = 'Failed to load brands';
    }
    isLoading.value = false;
  }

  void _filter() {
    if (searchQuery.value.isEmpty) {
      filtered.value = brands.toList();
    } else {
      final q = searchQuery.value.toLowerCase();
      filtered.value =
          brands.where((b) => b.name.toLowerCase().contains(q)).toList();
    }
  }

  Future<void> deleteBrand(String id) async {
    try {
      await _api.deleteBrand(id);
      brands.removeWhere((e) => e.id == id);
      _filter();
      AppSnackbar.success('Brand deleted');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}
