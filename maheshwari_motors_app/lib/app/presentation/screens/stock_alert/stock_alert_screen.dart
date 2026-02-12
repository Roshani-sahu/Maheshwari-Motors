import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/item_model.dart';
import '../../controllers/stock_alert_controller.dart';
import '../../shared/widgets/common_widgets.dart';

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
              child: _SummaryCard(
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
                  itemBuilder: (_, i) => _AlertCard(item: items[i]),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _SummaryCard({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border(left: BorderSide(color: color, width: 3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _AlertCard extends StatelessWidget {
  final ItemModel item;
  const _AlertCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.itemName,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
              StatusBadge.stock(item.stockStatus),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _StockInfo(
                label: 'Total Stock',
                value: AppFormatters.quantity(item.totalStock),
                color: item.isLowStock ? AppColors.error : AppColors.success,
              ),
              const SizedBox(width: 24),
              _StockInfo(
                label: 'Threshold',
                value: AppFormatters.quantity(item.threshold),
                color: AppColors.textSecondary,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StockInfo extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StockInfo({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }
}
