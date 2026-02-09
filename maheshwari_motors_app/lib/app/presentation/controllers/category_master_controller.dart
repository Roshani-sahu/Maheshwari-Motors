import 'package:get/get.dart';
import '../../data/models/category_model.dart';
import '../../data/services/api_service.dart';

class CategoryMasterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final RxList<CategoryModel> categories = <CategoryModel>[].obs;
  final RxBool isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    fetchCategories();
  }

  Future<void> fetchCategories() async {
    try {
      isLoading.value = true;
      categories.value = await _api.getCategories();
    } catch (e) {
      Get.snackbar('Error', e.toString());
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> deleteCategory(String id) async {
    try {
      await _api.deleteCategory(id);
      categories.removeWhere((e) => e.id == id);
      Get.snackbar('Success', 'Category deleted successfully');
    } catch (e) {
      Get.snackbar('Error', e.toString());
    }
  }
}
