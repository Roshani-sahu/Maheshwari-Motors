import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/discount/discount_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/discount_card.dart';

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
                    return DiscountCard(
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
