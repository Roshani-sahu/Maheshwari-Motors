import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/supplier_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class SupplierMasterScreen extends StatelessWidget {
  const SupplierMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(SupplierMasterController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('Manage Suppliers'),
        actions: [
          AppBarAddButton(
            onPressed: () async {
              final result = await Get.toNamed(AppRoutes.addSupplier);
              if (result == true) controller.fetchSuppliers();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          AppSearchBar(
            hint: 'Search suppliers...',
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
                  onRetry: controller.fetchSuppliers,
                );
              }
              if (controller.filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.local_shipping_outlined,
                  title: 'No suppliers found',
                  subtitle: 'Tap + to add a supplier',
                );
              }
              return RefreshIndicator(
                onRefresh: controller.fetchSuppliers,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: controller.filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final supplier = controller.filtered[index];
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
                                const SizedBox(height: 3),
                                if (supplier.phone != null)
                                  _InfoRow(
                                    icon: Icons.phone_outlined,
                                    text: supplier.phone!,
                                  ),
                                if (supplier.email != null) ...[
                                  const SizedBox(height: 2),
                                  _InfoRow(
                                    icon: Icons.email_outlined,
                                    text: supplier.email!,
                                  ),
                                ],
                                if (supplier.city != null) ...[
                                  const SizedBox(height: 2),
                                  _InfoRow(
                                    icon: Icons.location_on_outlined,
                                    text: supplier.city!,
                                  ),
                                ],
                              ],
                            ),
                          ),
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              ActionIcon(
                                icon: Icons.edit_outlined,
                                color: AppColors.accent,
                                onTap: () async {
                                  final result = await Get.toNamed(
                                    AppRoutes.editSupplier,
                                    arguments: supplier,
                                  );
                                  if (result == true) {
                                    controller.fetchSuppliers();
                                  }
                                },
                              ),
                              const SizedBox(height: 4),
                              ActionIcon(
                                icon: Icons.delete_outline,
                                color: AppColors.error,
                                onTap: () => DeleteConfirmSheet.show(
                                  context: context,
                                  title: 'Delete Supplier?',
                                  subtitle:
                                      'Are you sure you want to delete "${supplier.name}"?',
                                  onConfirm: () =>
                                      controller.deleteSupplier(supplier.id),
                                ),
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

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 13, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodySmall,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
