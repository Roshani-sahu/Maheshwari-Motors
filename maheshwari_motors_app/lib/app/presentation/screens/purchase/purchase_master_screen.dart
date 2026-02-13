import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/purchase/purchase_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/purchase_card.dart';

class PurchaseMasterScreen extends StatelessWidget {
  const PurchaseMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(PurchaseMasterController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('Purchases'),
        actions: [
          AppBarAddButton(
            onPressed: () async {
              final result = await Get.toNamed(AppRoutes.addPurchase);
              if (result == true) controller.loadPurchases();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          AppSearchBar(
            hint: 'Search by purchase no or supplier…',
            onChanged: (v) => controller.searchQuery.value = v,
          ),
          Obx(
            () => AppFilterChips(
              options: const ['all', 'GST', 'NON_GST'],
              selected: controller.typeFilter.value,
              onSelected: (v) => controller.typeFilter.value = v,
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }
              if (controller.errorMessage.isNotEmpty) {
                return ErrorState(
                  message: controller.errorMessage.value,
                  onRetry: controller.loadPurchases,
                );
              }
              if (controller.filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.shopping_cart_outlined,
                  title: 'No purchases found',
                  subtitle: 'Tap + to record a new purchase',
                );
              }
              return RefreshIndicator(
                onRefresh: controller.loadPurchases,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: controller.filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final purchase = controller.filtered[i];
                    return PurchaseCard(
                      purchase: purchase,
                      onRecordPayment: () async {
                        final result = await RecordPaymentSheet.show(
                          context: context,
                          referenceId: purchase.id,
                          referenceLabel: 'Purchase #${purchase.purchaseNo}',
                          totalAmount: purchase.amount,
                          paidAmount: purchase.paidAmount,
                          isSale: false,
                        );
                        if (result == true) controller.loadPurchases();
                      },
                      onDelete: () => DeleteConfirmSheet.show(
                        context: context,
                        title: 'Delete Purchase #${purchase.purchaseNo}?',
                        subtitle:
                            'Stock will be reversed. This cannot be undone.',
                        onConfirm: () => controller.deletePurchase(purchase.id),
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
