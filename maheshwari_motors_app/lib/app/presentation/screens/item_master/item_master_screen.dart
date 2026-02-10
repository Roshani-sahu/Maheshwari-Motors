import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../controllers/home_controller.dart';
import '../../controllers/item_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../data/models/item_model.dart';
import '../../../routes/app_routes.dart';

class ItemMasterScreen extends StatelessWidget {
  const ItemMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(ItemMasterController());

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        // leading: Get.isRegistered<HomeController>()
        //     ? IconButton(
        //         icon: const Icon(Icons.menu_rounded),
        //         onPressed: Get.find<HomeController>().openDrawer,
        //       )
        //     : null,
        title: const Text('Item Master'),
        actions: [
          AppBarAddButton(
            onPressed: () async {
              final result = await Get.toNamed(AppRoutes.addItem);
              if (result == true) controller.loadItems();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          AppSearchBar(
            hint: 'Search items...',
            onChanged: (v) => controller.searchQuery.value = v,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          ),
          Obx(
            () => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _MiniStat(
                    label: 'Low Stock',
                    value:
                        '${controller.items.where((i) => i.isLowStock).length}',
                    color: AppColors.error,
                  ),
                  const SizedBox(width: 12),
                  _MiniStat(
                    label: 'Total Items',
                    value: '${controller.items.length}',
                    color: AppColors.accent,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }
              if (controller.errorMessage.isNotEmpty) {
                return ErrorState(
                  message: controller.errorMessage.value,
                  onRetry: controller.loadItems,
                );
              }
              if (controller.filteredItems.isEmpty) {
                return const EmptyState(
                  icon: Icons.inventory_2_outlined,
                  title: 'No items found',
                  subtitle: 'Add your first item to get started',
                );
              }
              return RefreshIndicator(
                onRefresh: controller.loadItems,
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                  itemCount: controller.filteredItems.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = controller.filteredItems[index];
                    return _ItemCard(
                      item: item,
                      onEdit: () async {
                        final result = await Get.toNamed(
                          AppRoutes.editItem,
                          arguments: item,
                        );
                        if (result == true) controller.loadItems();
                      },
                      onDelete: () => DeleteConfirmSheet.show(
                        context: context,
                        title: 'Delete Item?',
                        subtitle:
                            'Are you sure you want to delete "${item.itemName}"?',
                        onConfirm: () => controller.deleteItem(item.id),
                      ),
                    );
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MiniStat({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border(left: BorderSide(color: color, width: 3)),
        ),
        child: Row(
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
            const Spacer(),
            Text(
              value,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: color,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ItemCard extends StatelessWidget {
  final ItemModel item;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ItemCard({
    required this.item,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Container(
              width: 52,
              height: 52,
              color: AppColors.surface,
              child: item.image != null
                  ? CachedNetworkImage(
                      imageUrl: item.image!,
                      fit: BoxFit.cover,
                      placeholder: (_, _) => const Icon(
                        Icons.image_outlined,
                        color: AppColors.textSecondary,
                      ),
                      errorWidget: (_, _, _) => const Icon(
                        Icons.image_outlined,
                        color: AppColors.textSecondary,
                      ),
                    )
                  : const Icon(
                      Icons.inventory_2_outlined,
                      color: AppColors.textSecondary,
                    ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.itemName,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      AppFormatters.currencyDecimal(item.amount),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Stock: ',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    Text(
                      '${item.totalStock}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: item.isLowStock
                            ? AppColors.error
                            : AppColors.success,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '/ ${item.threshold}',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              StatusBadge.stock(item.stockStatus),
              const SizedBox(height: 8),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ActionIcon(
                    icon: Icons.edit_outlined,
                    color: AppColors.accent,
                    onTap: onEdit,
                  ),
                  const SizedBox(width: 6),
                  ActionIcon(
                    icon: Icons.delete_outline,
                    color: AppColors.error,
                    onTap: onDelete,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
