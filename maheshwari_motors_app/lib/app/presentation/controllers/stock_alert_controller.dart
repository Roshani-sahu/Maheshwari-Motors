import 'package:get/get.dart';

import '../../data/models/item_model.dart';
import '../../data/services/api_service.dart';

class StockAlertController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<ItemModel> allItems = <ItemModel>[].obs;
  final RxList<ItemModel> lowStockItems = <ItemModel>[].obs;
  final RxList<ItemModel> displayedItems = <ItemModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadData();
    debounce(
      searchQuery,
      (_) => _applyFilter(),
      time: const Duration(milliseconds: 300),
    );
  }

  Future<void> loadData() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final items = await _api.getLowStockItems();
      lowStockItems.value = items;
      allItems.value = items;
      _applyFilter();
    } catch (e) {
      errorMessage.value = 'Failed to load stock data';
    }
    isLoading.value = false;
  }

  void _applyFilter() {
    if (searchQuery.value.isEmpty) {
      displayedItems.value = lowStockItems.toList();
    } else {
      final q = searchQuery.value.toLowerCase();
      displayedItems.value = lowStockItems
          .where((i) => i.itemName.toLowerCase().contains(q))
          .toList();
    }
  }
}
