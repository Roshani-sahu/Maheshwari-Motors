import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../controllers/discount_master/discount_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class DiscountMasterScreen extends StatelessWidget {
  const DiscountMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(DiscountMasterController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('Discount Master'),
        actions: [
          Obx(
            () => controller.isSaving.value
                ? const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : TextButton(
                    onPressed: controller.saveChanges,
                    child: const Text('Save'),
                  ),
          ),
        ],
      ),
      body: Obx(() {
        if (controller.isLoadingCategories.value) {
          return const Center(child: CircularProgressIndicator());
        }
        if (controller.categories.isEmpty) {
          return const EmptyState(
            icon: Icons.category_outlined,
            title: 'No categories found',
            subtitle: 'Add categories first to manage discounts',
          );
        }
        return Row(
          children: [
            SizedBox(
              width: 140,
              child: Container(
                color: AppColors.white,
                child: ListView.builder(
                  itemCount: controller.categories.length,
                  itemBuilder: (context, index) {
                    final cat = controller.categories[index];
                    return Obx(() {
                      final isSelected =
                          controller.selectedCategory.value?.id == cat.id;
                      return InkWell(
                        onTap: () => controller.selectCategory(cat),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 14,
                          ),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.accentLight
                                : Colors.transparent,
                            border: Border(
                              left: BorderSide(
                                color: isSelected
                                    ? AppColors.accent
                                    : Colors.transparent,
                                width: 3,
                              ),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                cat.name,
                                style: TextStyle(
                                  fontWeight: isSelected
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                  color: isSelected
                                      ? AppColors.accent
                                      : AppColors.textPrimary,
                                  fontSize: 13,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${cat.brandIds.length} brands',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    });
                  },
                ),
              ),
            ),
            const VerticalDivider(width: 1),
            Expanded(
              child: _BrandDiscountList(controller: controller),
            ),
          ],
        );
      }),
    );
  }
}

class _BrandDiscountList extends StatelessWidget {
  final DiscountMasterController controller;
  const _BrandDiscountList({required this.controller});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      if (controller.isLoadingDiscounts.value) {
        return const Center(child: CircularProgressIndicator());
      }
      if (controller.discounts.isEmpty) {
        return const EmptyState(
          icon: Icons.local_offer_outlined,
          title: 'No brands in this category',
          subtitle: 'Assign brands to this category first',
        );
      }
      return ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: controller.discounts.length,
        separatorBuilder: (context2, index2) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final d = controller.discounts[index];
          final brandId = d.brandId;
          return AppCard(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  d.brandName ?? 'Brand',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Discount I (GST)',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: _DiscountField(
                        label: 'Normal %',
                        controller: controller.d1NormalCtrls[brandId],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _DiscountField(
                        label: 'Special %',
                        controller: controller.d1SpecialCtrls[brandId],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  'Discount II (Non-GST)',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: _DiscountField(
                        label: 'Normal %',
                        controller: controller.d2NormalCtrls[brandId],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _DiscountField(
                        label: 'Special %',
                        controller: controller.d2SpecialCtrls[brandId],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      );
    });
  }
}

class _DiscountField extends StatelessWidget {
  final String label;
  final TextEditingController? controller;

  const _DiscountField({required this.label, this.controller});

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      style: const TextStyle(fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 12),
        isDense: true,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}
