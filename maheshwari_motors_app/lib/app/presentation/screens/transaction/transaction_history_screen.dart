import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/transaction_model.dart';
import '../../controllers/transaction_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class TransactionHistoryScreen extends StatelessWidget {
  const TransactionHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(TransactionHistoryController());

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Transactions')),
      body: Column(
        children: [
          Obx(() {
            if (controller.summary.isEmpty) return const SizedBox.shrink();
            return Container(
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.accentLight,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      children: [
                        Text(
                          '${controller.summary['total_transactions'] ?? 0}',
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: AppColors.accent,
                              ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Total',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  Container(width: 1, height: 40, color: AppColors.border),
                  Expanded(
                    child: Column(
                      children: [
                        Text(
                          AppFormatters.currency(
                            controller.summary['total_sale_amount'] ?? 0,
                          ),
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: AppColors.success,
                              ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Sale Amount',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
          AppSearchBar(
            hint: 'Search by party or type…',
            onChanged: (v) => controller.searchQuery.value = v,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          ),
          Obx(
            () => AppFilterChips(
              options: const ['all', 'sale', 'purchase', 'payment', 'receipt'],
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
                  onRetry: controller.loadData,
                );
              }
              if (controller.filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.swap_horiz,
                  title: 'No transactions found',
                  subtitle: 'Transactions will appear here',
                );
              }
              return RefreshIndicator(
                onRefresh: controller.loadData,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: controller.filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (_, i) =>
                      _TransactionCard(txn: controller.filtered[i]),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class _TransactionCard extends StatelessWidget {
  final TransactionModel txn;
  const _TransactionCard({required this.txn});

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color iconColor;
    switch (txn.type.toLowerCase()) {
      case 'sale':
        icon = Icons.arrow_upward;
        iconColor = AppColors.success;
      case 'purchase':
        icon = Icons.arrow_downward;
        iconColor = AppColors.error;
      case 'payment':
        icon = Icons.payment;
        iconColor = AppColors.info;
      default:
        icon = Icons.account_balance_wallet;
        iconColor = AppColors.warning;
    }

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  txn.partyName ?? txn.supplierName ?? 'N/A',
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 3),
                Text(
                  '${txn.type.capitalizeFirst} • ${txn.paymentMode.capitalizeFirst}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 2),
                Text(
                  AppFormatters.dateTime(txn.createdAt),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Text(
            AppFormatters.currency(txn.amount),
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: iconColor,
            ),
          ),
        ],
      ),
    );
  }
}
