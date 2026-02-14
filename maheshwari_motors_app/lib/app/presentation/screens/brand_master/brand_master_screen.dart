import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/brand_master/brand_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class BrandMasterScreen extends StatelessWidget {
  const BrandMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(BrandMasterController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('Brand Master'),
        actions: [
          AppBarAddButton(
            onPressed: () async {
              final result = await Get.toNamed(AppRoutes.addBrand);
              if (result == true) controller.fetchBrands();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          AppSearchBar(
            hint: 'Search brands...',
            onChanged: (v) => controller.searchQuery.value = v,
          ),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }
              if (controller.errorMessage.isNotEmpty) {
                return ErrorState(
                  message: controller.errorMessage.value,
                  onRetry: controller.fetchBrands,
                );
              }
              if (controller.filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.branding_watermark_outlined,
                  title: 'No brands found',
                  subtitle: 'Tap + to add a brand',
                );
              }
              return RefreshIndicator(
                onRefresh: controller.fetchBrands,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: controller.filtered.length,
                  separatorBuilder: (_, i) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final brand = controller.filtered[index];
                    return AppCard(
                      onTap: () =>
                          Get.toNamed(AppRoutes.viewBrand, arguments: brand),
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: AppColors.accentLight,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(
                                  Icons.branding_watermark_rounded,
                                  color: AppColors.accent,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Text(
                                  brand.name,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleSmall
                                      ?.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                                ),
                              ),
                              ActionIcon(
                                icon: Icons.edit_outlined,
                                color: AppColors.accent,
                                onTap: () async {
                                  final result = await Get.toNamed(
                                    AppRoutes.editBrand,
                                    arguments: brand,
                                  );
                                  if (result == true) controller.fetchBrands();
                                },
                              ),
                              const SizedBox(width: 6),
                              ActionIcon(
                                icon: Icons.delete_outline,
                                color: AppColors.error,
                                onTap: () => DeleteConfirmSheet.show(
                                  context: context,
                                  title: 'Delete Brand?',
                                  subtitle:
                                      'Are you sure you want to delete "${brand.name}"?',
                                  onConfirm: () =>
                                      controller.deleteBrand(brand.id),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              const Spacer(),
                              Text(
                                '${brand.itemIds.length} items',
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ],
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
