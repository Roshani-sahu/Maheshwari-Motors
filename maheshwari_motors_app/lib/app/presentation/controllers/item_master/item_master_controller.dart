import 'package:get/get.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/item_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';

class ItemMasterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<ItemModel> items = <ItemModel>[].obs;
  final RxList<ItemModel> filteredItems = <ItemModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadItems();
    debounce(
      searchQuery,
      (_) => filterItems(),
      time: const Duration(milliseconds: 300),
    );
  }

  Future<void> loadItems() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      items.value = await _api.getItems();
      filterItems();
    } catch (e) {
      errorMessage.value = 'Failed to load items';
    }
    isLoading.value = false;
  }

  void filterItems() {
    if (searchQuery.value.isEmpty) {
      filteredItems.value = items.toList();
    } else {
      filteredItems.value = items
          .where(
            (i) => i.itemName.toLowerCase().contains(
              searchQuery.value.toLowerCase(),
            ),
          )
          .toList();
    }
  }

  Future<void> deleteItem(String id) async {
    try {
      await _api.deleteItem(id);
      items.removeWhere((i) => i.id == id);
      filterItems();
      AppSnackbar.success('Item deleted');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}
