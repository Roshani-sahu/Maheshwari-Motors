import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/item_master/item_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../routes/app_routes.dart';
import 'widgets/mini_stat.dart';
import 'widgets/item_card.dart';

class ItemMasterScreen extends StatelessWidget {
  const ItemMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(ItemMasterController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
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
                  MiniStat(
                    label: 'Low Stock',
                    value:
                        '${controller.items.where((i) => i.isLowStock).length}',
                    color: AppColors.error,
                  ),
                  const SizedBox(width: 12),
                  MiniStat(
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
                    return ItemCard(
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
