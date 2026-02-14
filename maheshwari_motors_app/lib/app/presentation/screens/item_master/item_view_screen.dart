import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../controllers/item_master/item_view_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class ItemViewScreen extends StatelessWidget {
  const ItemViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.put(ItemViewController());

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
                                if (item.brandName != null)
                                  Text(
                                    item.brandName!,
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
                            AppFormatters.currencyDecimal(item.saleRate),
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
