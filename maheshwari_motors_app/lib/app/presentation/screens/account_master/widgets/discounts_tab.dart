import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../routes/app_routes.dart';
import '../../../controllers/account_master/account_master_controller.dart';
import '../../../shared/widgets/common_widgets.dart';
import 'account_discount_card.dart';

class DiscountsTab extends StatelessWidget {
  final AccountMasterController c;
  const DiscountsTab({super.key, required this.c});

  @override
  Widget build(BuildContext context) {
    return Column(
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
            selected: c.discountTypeFilter.value,
            onSelected: (v) => c.discountTypeFilter.value = v,
          ),
        ),
        Expanded(
          child: Obx(() {
            if (c.discountLoading.value) {
              return const Center(child: CircularProgressIndicator());
            }
            if (c.discountError.isNotEmpty) {
              return ErrorState(
                message: c.discountError.value,
                onRetry: c.loadDiscounts,
              );
            }
            if (c.filteredDiscounts.isEmpty) {
              return const EmptyState(
                icon: Icons.percent,
                title: 'No discounts found',
                subtitle: 'Discount rules will appear here',
              );
            }
            return RefreshIndicator(
              onRefresh: c.loadDiscounts,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: c.filteredDiscounts.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final discount = c.filteredDiscounts[i];
                  return AccountDiscountCard(
                    discount: discount,
                    onEdit: () async {
                      final result = await Get.toNamed(
                        AppRoutes.editDiscount,
                        arguments: discount,
                      );
                      if (result == true) c.loadDiscounts();
                    },
                    onDelete: () => DeleteConfirmSheet.show(
                      context: context,
                      title: 'Remove Discount?',
                      subtitle:
                          'Remove ${discount.displayValue} discount on ${discount.targetName}?',
                      onConfirm: () => c.deleteDiscount(discount.id),
                    ),
                  );
                },
              ),
            );
          }),
        ),
      ],
    );
  }
}
