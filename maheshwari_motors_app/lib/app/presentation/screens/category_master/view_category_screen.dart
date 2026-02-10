import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../data/models/category_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';

class _ViewCategoryController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final RxList<CategoryModel> categories = <CategoryModel>[].obs;
  final RxList<CategoryModel> filtered = <CategoryModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadCategories();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
  }

  Future<void> loadCategories() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      categories.value = await _api.getCategories();
      _filter();
    } catch (e) {
      errorMessage.value = 'Failed to load categories';
    }
    isLoading.value = false;
  }

  void _filter() {
    if (searchQuery.value.isEmpty) {
      filtered.value = categories;
    } else {
      final q = searchQuery.value.toLowerCase();
      filtered.value = categories
          .where((c) => c.name.toLowerCase().contains(q))
          .toList();
    }
  }
}

class ViewCategoryScreen extends StatelessWidget {
  const ViewCategoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.put(_ViewCategoryController());

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
                            child: Text(
                              category.name,
                              style: Theme.of(context).textTheme.titleSmall
                                  ?.copyWith(fontWeight: FontWeight.w600),
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
