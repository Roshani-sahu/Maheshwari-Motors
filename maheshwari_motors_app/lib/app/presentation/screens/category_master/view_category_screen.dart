import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../controllers/category_master/view_category_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class ViewCategoryScreen extends StatelessWidget {
  const ViewCategoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.put(ViewCategoryController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('View Category'),
      ),
      body: Column(
        children: [
          AppSearchBar(
            hint: 'Search categories...',
            onChanged: (v) => c.searchQuery.value = v,
          ),
          Expanded(
            child: Obx(() {
              if (c.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }
              if (c.errorMessage.isNotEmpty) {
                return ErrorState(
                  message: c.errorMessage.value,
                  onRetry: c.loadCategories,
                );
              }
              if (c.filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.category_outlined,
                  title: 'No categories found',
                  subtitle: 'Categories will appear here',
                );
              }
              return RefreshIndicator(
                onRefresh: c.loadCategories,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: c.filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final category = c.filtered[index];
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
                                if (category.brands.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 4,
                                    children: category.brands.map((b) {
                                      return Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: AppColors.accentLight,
                                          borderRadius: BorderRadius.circular(
                                            6,
                                          ),
                                        ),
                                        child: Text(
                                          b.name,
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: AppColors.accent,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ],
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
