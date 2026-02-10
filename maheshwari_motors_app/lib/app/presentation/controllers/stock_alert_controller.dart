import 'package:get/get.dart';

import '../../data/models/item_model.dart';
import '../../data/services/api_service.dart';

class StockAlertController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<ItemModel> allItems = <ItemModel>[].obs;
  final RxList<ItemModel> lowStockItems = <ItemModel>[].obs;
  final RxList<ItemModel> displayedItems = <ItemModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxBool showOnlyLow = true.obs;
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
    ever(showOnlyLow, (_) => _applyFilter());
  }

  Future<void> loadData() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final results = await Future.wait([
        _api.getItems(),
        _api.getLowStockItems(),
      ]);
      allItems.value = results[0];
      lowStockItems.value = results[1];
      _applyFilter();
    } catch (e) {
      errorMessage.value = 'Failed to load stock data';
    }
    isLoading.value = false;
  }

  void _applyFilter() {
    final source = showOnlyLow.value ? lowStockItems : allItems;
    if (searchQuery.value.isEmpty) {
      displayedItems.value = source.toList();
    } else {
      final q = searchQuery.value.toLowerCase();
      displayedItems.value = source
          .where((i) => i.itemName.toLowerCase().contains(q))
          .toList();
    }
  }
}
