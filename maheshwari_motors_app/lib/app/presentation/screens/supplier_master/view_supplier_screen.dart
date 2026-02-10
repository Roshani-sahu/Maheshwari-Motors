import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../data/models/supplier_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';

class _ViewSupplierController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final RxList<SupplierModel> suppliers = <SupplierModel>[].obs;
  final RxList<SupplierModel> filtered = <SupplierModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadSuppliers();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
  }

  Future<void> loadSuppliers() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      suppliers.value = await _api.getSuppliers();
      _filter();
    } catch (e) {
      errorMessage.value = 'Failed to load suppliers';
    }
    isLoading.value = false;
  }

  void _filter() {
    if (searchQuery.value.isEmpty) {
      filtered.value = suppliers;
    } else {
      final q = searchQuery.value.toLowerCase();
      filtered.value = suppliers
          .where(
            (s) =>
                s.name.toLowerCase().contains(q) ||
                (s.phone?.contains(q) ?? false) ||
                (s.email?.toLowerCase().contains(q) ?? false),
          )
          .toList();
    }
  }
}

class ViewSupplierScreen extends StatelessWidget {
  const ViewSupplierScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.put(_ViewSupplierController());

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('View All Supplier')),
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
