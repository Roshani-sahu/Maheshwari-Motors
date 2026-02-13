import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/stock_alert/stock_alert_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/alert_card.dart';
import 'widgets/alert_summary_card.dart';

class StockAlertScreen extends StatelessWidget {
  const StockAlertScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(StockAlertController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('Stock Alert Master'),
      ),
      body: Column(
        children: [
          Obx(
            () => Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: AlertSummaryCard(
                label: 'Low Stock Items',
                value: '${controller.lowStockItems.length}',
                color: AppColors.error,
              ),
            ),
          ),
          const SizedBox(height: 8),
          AppSearchBar(
            hint: 'Search items...',
            onChanged: (v) => controller.searchQuery.value = v,
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
          ),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }
              if (controller.errorMessage.isNotEmpty) {
                return ErrorState(
                  message: controller.errorMessage.value,
                  onRetry: controller.loadData,
                );
              }
              final items = controller.displayedItems;
              if (items.isEmpty) {
                return const EmptyState(
                  icon: Icons.inventory_2_outlined,
                  title: 'No stock alerts',
                  subtitle: 'All items are sufficiently stocked',
                );
              }
              return RefreshIndicator(
                onRefresh: controller.loadData,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (_, i) => AlertCard(item: items[i]),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
