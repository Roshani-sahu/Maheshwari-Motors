import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../data/models/item_model.dart';
import '../../../data/services/api_service.dart';

class StockAlertController extends GetxController {
  final ApiService _api = ApiService();

  final RxList<ItemModel> allItems = <ItemModel>[].obs;
  final RxList<ItemModel> lowStockItems = <ItemModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxBool showOnlyLow = true.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadData();
  }

  Future<void> loadData() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      allItems.value = await _api.getItems();
      lowStockItems.value = allItems.where((i) => i.isLowStock).toList();
    } catch (e) {
      errorMessage.value = 'Failed to load stock data';
    }
    isLoading.value = false;
  }

  List<ItemModel> get displayedItems =>
      showOnlyLow.value ? lowStockItems : allItems;
}

class StockAlertScreen extends StatelessWidget {
  const StockAlertScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(StockAlertController());

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Stock Alert Master'),
        actions: [
          Obx(
            () => Row(
              children: [
                Text('LOW only', style: Theme.of(context).textTheme.bodySmall),
                Switch.adaptive(
                  value: controller.showOnlyLow.value,
                  onChanged: (v) => controller.showOnlyLow.value = v,
                  activeTrackColor: AppColors.accent,
                ),
              ],
            ),
          ),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }
        if (controller.errorMessage.isNotEmpty) {
          return ErrorState(
            message: controller.errorMessage.value,
            onRetry: controller.loadData,
          );
        }
        return RefreshIndicator(
          onRefresh: controller.loadData,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Stats
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.errorLight,
                        borderRadius: BorderRadius.circular(14),
                        border: Border(
                          left: BorderSide(color: AppColors.error, width: 3),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Low Stock Items',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: AppColors.error),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${controller.lowStockItems.length}',
                            style: Theme.of(context).textTheme.headlineMedium
                                ?.copyWith(color: AppColors.error),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.accentLight,
                        borderRadius: BorderRadius.circular(14),
                        border: Border(
                          left: BorderSide(color: AppColors.accent, width: 3),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Total',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: AppColors.accent),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${controller.allItems.length}',
                            style: Theme.of(context).textTheme.headlineMedium
                                ?.copyWith(color: AppColors.accent),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Items table-like list
              if (controller.displayedItems.isEmpty)
                const EmptyState(
                  icon: Icons.check_circle_outline,
                  title: 'All items are in stock!',
                  subtitle: 'No items below threshold',
                )
              else
                // Header
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(12),
                    ),
                  ),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 30,
                        child: Text(
                          '#',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          'ITEM NAME',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          'STOCK',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          'THRESHOLD',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
              ...controller.displayedItems.asMap().entries.map((entry) {
                final idx = entry.key;
                final item = entry.value;
                return Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    border: Border(
                      bottom: BorderSide(color: AppColors.border, width: 0.5),
                    ),
                    borderRadius: idx == controller.displayedItems.length - 1
                        ? const BorderRadius.vertical(
                            bottom: Radius.circular(12),
                          )
                        : null,
                  ),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 30,
                        child: Text(
                          '${idx + 1}',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: AppColors.accent),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          item.itemName,
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          '${item.totalStock}',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(
                                color: item.isLowStock
                                    ? AppColors.error
                                    : AppColors.success,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          '${item.threshold}',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(
                                color: AppColors.accent,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        );
      }),
    );
  }
}
