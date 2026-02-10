import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/purchase_model.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/auth_controller.dart';
import '../../controllers/purchase_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class PurchaseMasterScreen extends StatelessWidget {
  const PurchaseMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(PurchaseMasterController());
    final auth = Get.find<AuthController>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
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
                    return _PurchaseCard(
                      purchase: purchase,
                      onRecordPayment: () async {
                        final result = await RecordPaymentSheet.show(
                          context: context,
                          firmId: auth.firmId,
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

class _PurchaseCard extends StatelessWidget {
  final PurchaseModel purchase;
  final VoidCallback? onRecordPayment;
  final VoidCallback? onDelete;

  const _PurchaseCard({
    required this.purchase,
    this.onRecordPayment,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.accentLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '#${purchase.purchaseNo}',
                  style: const TextStyle(
                    color: AppColors.accent,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              StatusBadge(
                label: purchase.purchaseType,
                color: purchase.purchaseType == 'GST'
                    ? AppColors.infoLight
                    : AppColors.warningLight,
                textColor: purchase.purchaseType == 'GST'
                    ? AppColors.info
                    : AppColors.warning,
              ),
              const Spacer(),
              StatusBadge.payment(purchase.paymentStatus),
              const SizedBox(width: 4),
              PopupMenuButton<String>(
                icon: const Icon(
                  Icons.more_vert,
                  size: 20,
                  color: AppColors.textSecondary,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                onSelected: (v) {
                  if (v == 'payment') onRecordPayment?.call();
                  if (v == 'delete') onDelete?.call();
                },
                itemBuilder: (_) => [
                  if (onRecordPayment != null)
                    const PopupMenuItem(
                      value: 'payment',
                      child: Row(
                        children: [
                          Icon(
                            Icons.payment,
                            size: 18,
                            color: AppColors.success,
                          ),
                          SizedBox(width: 8),
                          Text('Record Payment'),
                        ],
                      ),
                    ),
                  if (onDelete != null)
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(
                            Icons.delete_outline,
                            size: 18,
                            color: AppColors.error,
                          ),
                          SizedBox(width: 8),
                          Text('Delete'),
                        ],
                      ),
                    ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(
                Icons.store_outlined,
                size: 16,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  purchase.supplierName ?? 'N/A',
                  style: Theme.of(context).textTheme.bodyMedium,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const Icon(
                Icons.calendar_today,
                size: 14,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Text(
                AppFormatters.dateShort(purchase.date),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Paid: ${AppFormatters.currency(purchase.paidAmount)}',
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: AppColors.success),
                  ),
                  Text(
                    'Balance: ${AppFormatters.currency(purchase.balanceAmount)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: purchase.balanceAmount > 0
                          ? AppColors.error
                          : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              Text(
                AppFormatters.currency(purchase.amount),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.accent,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
