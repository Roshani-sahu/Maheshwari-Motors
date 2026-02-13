import 'package:get/get.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/category_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';

class CategoryMasterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<CategoryModel> categories = <CategoryModel>[].obs;
  final RxList<CategoryModel> filtered = <CategoryModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    fetchCategories();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
  }

  Future<void> fetchCategories() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      categories.value = await _api.getCategories();
      _filter();
    } catch (e) {
      errorMessage.value = 'Failed to load categories';
    }
    isLoading.value = false;
  }

  void _filter() {
    if (searchQuery.value.isEmpty) {
      filtered.value = categories.toList();
    } else {
      final q = searchQuery.value.toLowerCase();
      filtered.value = categories
          .where((c) => c.name.toLowerCase().contains(q))
          .toList();
    }
  }

  Future<void> deleteCategory(String id) async {
    try {
      await _api.deleteCategory(id);
      categories.removeWhere((e) => e.id == id);
      _filter();
      AppSnackbar.success('Category deleted');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}
