import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../controllers/supplier_master/view_supplier_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/supplier_detail_row.dart';

class ViewSupplierScreen extends StatelessWidget {
  const ViewSupplierScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.put(ViewSupplierController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('View All Supplier'),
      ),
      body: Column(
        children: [
          AppSearchBar(
            hint: 'Search suppliers...',
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
                  onRetry: c.loadSuppliers,
                );
              }
              if (c.filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.local_shipping_outlined,
                  title: 'No suppliers found',
                  subtitle: 'Suppliers will appear here',
                );
              }
              return RefreshIndicator(
                onRefresh: c.loadSuppliers,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: c.filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final supplier = c.filtered[index];
                    return AppCard(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 22,
                            backgroundColor: AppColors.accentLight,
                            child: Text(
                              supplier.name.isNotEmpty
                                  ? supplier.name[0].toUpperCase()
                                  : '?',
                              style: const TextStyle(
                                color: AppColors.accent,
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  supplier.name,
                                  style: Theme.of(context).textTheme.titleSmall
                                      ?.copyWith(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 4),
                                if (supplier.phone != null)
                                  SupplierDetailRow(
                                    icon: Icons.phone_outlined,
                                    text: supplier.phone!,
                                  ),
                                if (supplier.email != null) ...[
                                  const SizedBox(height: 2),
                                  SupplierDetailRow(
                                    icon: Icons.email_outlined,
                                    text: supplier.email!,
                                  ),
                                ],
                                if (supplier.city != null) ...[
                                  const SizedBox(height: 2),
                                  SupplierDetailRow(
                                    icon: Icons.location_on_outlined,
                                    text: supplier.city!,
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
