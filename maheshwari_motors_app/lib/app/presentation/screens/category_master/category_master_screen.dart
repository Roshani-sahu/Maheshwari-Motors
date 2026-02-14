import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/category_master/category_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class CategoryMasterScreen extends StatelessWidget {
  const CategoryMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(CategoryMasterController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('Category Master'),
        actions: [
          AppBarAddButton(
            onPressed: () async {
              final result = await Get.toNamed(AppRoutes.addCategory);
              if (result == true) controller.fetchCategories();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          AppSearchBar(
            hint: 'Search categories...',
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
                  onRetry: controller.fetchCategories,
                );
              }
              if (controller.filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.category_outlined,
                  title: 'No categories found',
                  subtitle: 'Tap + to add a category',
                );
              }
              return RefreshIndicator(
                onRefresh: controller.fetchCategories,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: controller.filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final category = controller.filtered[index];
                    return AppCard(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppColors.accentLight,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: Text(
                                '${index + 1}',
                                style: const TextStyle(
                                  color: AppColors.accent,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  category.name,
                                  style: Theme.of(context).textTheme.titleSmall
                                      ?.copyWith(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${category.brands.length} brands',
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(
                                        color: AppColors.textSecondary,
                                      ),
                                ),
                              ],
                            ),
                          ),
                          ActionIcon(
                            icon: Icons.edit_outlined,
                            color: AppColors.accent,
                            onTap: () async {
                              final result = await Get.toNamed(
                                AppRoutes.editCategory,
                                arguments: category,
                              );
                              if (result == true) controller.fetchCategories();
                            },
                          ),
                          const SizedBox(width: 6),
                          ActionIcon(
                            icon: Icons.delete_outline,
                            color: AppColors.error,
                            onTap: () => DeleteConfirmSheet.show(
                              context: context,
                              title: 'Delete Category?',
                              subtitle:
                                  'Are you sure you want to delete "${category.name}"?',
                              onConfirm: () =>
                                  controller.deleteCategory(category.id),
                            ),
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
