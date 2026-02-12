import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../data/models/discount_model.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/discount_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class DiscountMasterScreen extends StatelessWidget {
  const DiscountMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<DiscountMasterController>();

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('Discount Rules'),
        actions: [
          AppBarAddButton(
            onPressed: () async {
              final result = await Get.toNamed(AppRoutes.addDiscount);
              if (result == true) controller.loadDiscounts();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Obx(
            () => AppFilterChips(
              options: const [
                'all',
                'item',
                'party_item',
                'party_all',
                'item_group',
                'profit_margin',
              ],
              selected: controller.typeFilter.value,
              onSelected: (v) => controller.typeFilter.value = v,
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }
              if (controller.errorMessage.isNotEmpty) {
                return ErrorState(
                  message: controller.errorMessage.value,
                  onRetry: controller.loadDiscounts,
                );
              }
              if (controller.filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.percent,
                  title: 'No discount rules',
                  subtitle: 'Tap + to create a discount rule',
                );
              }
              return RefreshIndicator(
                onRefresh: controller.loadDiscounts,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: controller.filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final discount = controller.filtered[i];
                    return _DiscountCard(
                      discount: discount,
                      onEdit: () async {
                        final result = await Get.toNamed(
                          AppRoutes.editDiscount,
                          arguments: discount,
                        );
                        if (result == true) controller.loadDiscounts();
                      },
                      onDelete: () => DeleteConfirmSheet.show(
                        context: context,
                        title: 'Remove Discount Rule?',
                        subtitle:
                            '${discount.displayValue} on ${discount.targetName}',
                        onConfirm: () => controller.deleteDiscount(discount.id),
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

class _DiscountCard extends StatelessWidget {
  final DiscountModel discount;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const _DiscountCard({required this.discount, this.onEdit, this.onDelete});

  @override
  Widget build(BuildContext context) {
    Color badgeColor;
    Color badgeTextColor;
    IconData typeIcon;
    switch (discount.type) {
      case 'item':
        badgeColor = AppColors.infoLight;
        badgeTextColor = AppColors.info;
        typeIcon = Icons.inventory_2_outlined;
        break;
      case 'party_item':
        badgeColor = AppColors.successLight;
        badgeTextColor = AppColors.success;
        typeIcon = Icons.people_outline;
        break;
      case 'party_all':
        badgeColor = AppColors.successLight;
        badgeTextColor = AppColors.success;
        typeIcon = Icons.person_outline;
        break;
      case 'item_group':
        badgeColor = const Color(0xFFFFF3E0);
        badgeTextColor = Colors.orange;
        typeIcon = Icons.category_outlined;
        break;
      case 'profit_margin':
        badgeColor = const Color(0xFFF3E5F5);
        badgeTextColor = Colors.purple;
        typeIcon = Icons.trending_up;
        break;
      default:
        badgeColor = AppColors.infoLight;
        badgeTextColor = AppColors.info;
        typeIcon = Icons.percent;
    }

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: badgeColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(typeIcon, color: badgeTextColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  discount.targetName,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    StatusBadge(
                      label: discount.typeLabel,
                      color: badgeColor,
                      textColor: badgeTextColor,
                    ),
                    if (!discount.isActive) ...[
                      const SizedBox(width: 8),
                      const StatusBadge(
                        label: 'INACTIVE',
                        color: Color(0xFFFFEBEE),
                        textColor: Colors.red,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.accentLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              discount.displayValue,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: AppColors.accent,
              ),
            ),
          ),
          const SizedBox(width: 4),
          AppPopupMenu(onEdit: onEdit, onDelete: onDelete),
        ],
      ),
    );
  }
}
