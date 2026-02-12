import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/item_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';

class _ItemViewController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final RxList<ItemModel> items = <ItemModel>[].obs;
  final RxList<ItemModel> filtered = <ItemModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadItems();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
  }

  Future<void> loadItems() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      items.value = await _api.getItems();
      _filter();
    } catch (e) {
      errorMessage.value = 'Failed to load items';
    }
    isLoading.value = false;
  }

  void _filter() {
    if (searchQuery.value.isEmpty) {
      filtered.value = items;
    } else {
      final q = searchQuery.value.toLowerCase();
      filtered.value = items
          .where((i) => i.itemName.toLowerCase().contains(q))
          .toList();
    }
  }
}

class ItemViewScreen extends StatelessWidget {
  const ItemViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.put(_ItemViewController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('Item View'),
      ),
      body: Column(
        children: [
          AppSearchBar(
            hint: 'Search items...',
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
                  onRetry: c.loadItems,
                );
              }
              if (c.filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.inventory_2_outlined,
                  title: 'No items found',
                  subtitle: 'Items will appear here',
                );
              }
              return RefreshIndicator(
                onRefresh: c.loadItems,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: c.filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = c.filtered[index];
                    return AppCard(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              width: 48,
                              height: 48,
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
                                  style: Theme.of(context).textTheme.titleSmall
                                      ?.copyWith(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 4),
                                if (item.categoryNames.isNotEmpty)
                                  Text(
                                    item.categoryNames.join(', '),
                                    style: Theme.of(context).textTheme.bodySmall
                                        ?.copyWith(
                                          color: AppColors.textSecondary,
                                        ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                              ],
                            ),
                          ),
                          Text(
                            AppFormatters.currencyDecimal(item.amount),
                            style: Theme.of(context).textTheme.titleSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.accent,
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
