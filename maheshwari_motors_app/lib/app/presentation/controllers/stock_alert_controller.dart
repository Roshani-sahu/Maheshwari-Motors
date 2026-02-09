import 'package:get/get.dart';

import '../../data/models/item_model.dart';
import '../../data/services/api_service.dart';

class StockAlertController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<ItemModel> allItems = <ItemModel>[].obs;
  final RxList<ItemModel> lowStockItems = <ItemModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxBool showOnlyLow = true.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    ever(showOnlyLow, (_) => _loadForMode());
    loadData();
  }

  Future<void> loadData() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      lowStockItems.value = await _api.getLowStockItems();
      if (!showOnlyLow.value) {
        allItems.value = await _api.getItems();
      }
    } catch (e) {
      errorMessage.value = 'Failed to load stock data';
    }
    isLoading.value = false;
  }

  Future<void> _loadForMode() async {
    if (isLoading.value) return;
    if (!showOnlyLow.value && allItems.isEmpty) {
      isLoading.value = true;
      try {
        allItems.value = await _api.getItems();
      } catch (e) {
        errorMessage.value = 'Failed to load items';
      }
      isLoading.value = false;
    }
  }

  List<ItemModel> get displayedItems =>
      showOnlyLow.value ? lowStockItems : allItems;
}
