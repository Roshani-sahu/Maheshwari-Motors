import 'package:get/get.dart';

import '../../../data/models/category_model.dart';
import '../../../data/services/api_service.dart';

class ViewCategoryController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final RxList<CategoryModel> categories = <CategoryModel>[].obs;
  final RxList<CategoryModel> filtered = <CategoryModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadCategories();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
  }

  Future<void> loadCategories() async {
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
      filtered.value = categories;
    } else {
      final q = searchQuery.value.toLowerCase();
      filtered.value = categories
          .where((c) => c.name.toLowerCase().contains(q))
          .toList();
    }
  }
}
