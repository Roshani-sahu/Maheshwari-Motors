import 'package:get/get.dart';
import '../../../data/models/item_model.dart';
import '../../../data/services/api_service.dart';

class ItemViewController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final RxList<ItemModel> items = <ItemModel>[].obs;
  final RxList<ItemModel> filtered = <ItemModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadItems();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
  }

  Future<void> loadItems() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      items.value = await _api.getItems();
      _filter();
    } catch (e) {
      errorMessage.value = 'Failed to load items';
    }
    isLoading.value = false;
  }

  void _filter() {
    if (searchQuery.value.isEmpty) {
      filtered.value = items;
    } else {
      final q = searchQuery.value.toLowerCase();
      filtered.value = items
          .where((i) => i.itemName.toLowerCase().contains(q))
          .toList();
    }
  }
}
