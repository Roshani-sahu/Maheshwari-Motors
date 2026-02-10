import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/discount_model.dart';
import '../../../data/models/transaction_model.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/account_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class AccountMasterScreen extends StatelessWidget {
  const AccountMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.put(AccountMasterController());

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        drawer: const AppDrawer(),
        backgroundColor: AppColors.background,
        appBar: AppBar(
          leading: const AppDrawerButton(),
          title: const Text('Account Master'),
          bottom: const TabBar(
            labelColor: AppColors.accent,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.accent,
            indicatorSize: TabBarIndicatorSize.label,
            tabs: [
              Tab(icon: Icon(Icons.swap_horiz, size: 18), text: 'Transactions'),
              Tab(icon: Icon(Icons.percent, size: 18), text: 'Discounts'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _TransactionsTab(c: c),
            _DiscountsTab(c: c),
          ],
        ),
      ),
    );
  }
}

// ─── Transactions Tab ────────────────────────────────────────────────

class _TransactionsTab extends StatelessWidget {
  final AccountMasterController c;
  const _TransactionsTab({required this.c});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Summary bar
        Obx(() {
          if (c.summary.value.isEmpty) return const SizedBox.shrink();
          return Container(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            padding: const EdgeInsets.all(14),
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
                        '${c.summary.value['total_transactions'] ?? 0}',
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
                Container(width: 1, height: 36, color: AppColors.border),
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        AppFormatters.currency(
                          c.summary.value['total_sale_amount'] ?? 0,
                        ),
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.success,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Sales',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                Container(width: 1, height: 36, color: AppColors.border),
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        AppFormatters.currency(
                          c.summary.value['total_purchase_amount'] ?? 0,
                        ),
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.error,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Purchases',
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
          hint: 'Search by firm, party or UTR…',
          onChanged: (v) => c.txnSearch.value = v,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        ),
        Obx(
          () => AppFilterChips(
            options: const ['all', 'sale', 'purchase'],
            selected: c.txnTypeFilter.value,
            onSelected: (v) => c.txnTypeFilter.value = v,
          ),
        ),
        const SizedBox(height: 4),
        Expanded(
          child: Obx(() {
            if (c.txnLoading.value) {
              return const Center(child: CircularProgressIndicator());
            }
            if (c.txnError.isNotEmpty) {
              return ErrorState(
                message: c.txnError.value,
                onRetry: c.loadTransactions,
              );
            }
            if (c.filteredTxns.isEmpty) {
              return const EmptyState(
                icon: Icons.swap_horiz,
                title: 'No transactions found',
                subtitle: 'Transactions will appear here',
              );
            }
            return RefreshIndicator(
              onRefresh: c.loadTransactions,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: c.filteredTxns.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) => _TransactionCard(txn: c.filteredTxns[i]),
              ),
            );
          }),
        ),
      ],
    );
  }
}

class _TransactionCard extends StatelessWidget {
  final TransactionModel txn;
  const _TransactionCard({required this.txn});

  @override
  Widget build(BuildContext context) {
    final isSale = txn.type.toLowerCase() == 'sale';
    final iconColor = isSale ? AppColors.success : AppColors.error;

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
            child: Icon(
              isSale ? Icons.arrow_upward : Icons.arrow_downward,
              color: iconColor,
              size: 20,
            ),
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
                Row(
                  children: [
                    StatusBadge(
                      label: txn.type.toUpperCase(),
                      color: isSale
                          ? AppColors.successLight
                          : AppColors.errorLight,
                      textColor: iconColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      txn.paymentMode.capitalizeFirst ?? '',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                if (txn.utr != null && txn.utr!.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    'UTR: ${txn.utr}',
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(fontSize: 11),
                  ),
                ],
                const SizedBox(height: 3),
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

// ─── Discounts Tab ───────────────────────────────────────────────────

class _DiscountsTab extends StatelessWidget {
  final AccountMasterController c;
  const _DiscountsTab({required this.c});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Obx(
          () => AppFilterChips(
            options: const ['all', 'item', 'party'],
            selected: c.discountTypeFilter.value,
            onSelected: (v) => c.discountTypeFilter.value = v,
          ),
        ),
        Expanded(
          child: Obx(() {
            if (c.discountLoading.value) {
              return const Center(child: CircularProgressIndicator());
            }
            if (c.discountError.isNotEmpty) {
              return ErrorState(
                message: c.discountError.value,
                onRetry: c.loadDiscounts,
              );
            }
            if (c.filteredDiscounts.isEmpty) {
              return const EmptyState(
                icon: Icons.percent,
                title: 'No discounts found',
                subtitle: 'Discount rules will appear here',
              );
            }
            return RefreshIndicator(
              onRefresh: c.loadDiscounts,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: c.filteredDiscounts.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final discount = c.filteredDiscounts[i];
                  return _DiscountCard(
                    discount: discount,
                    onEdit: () async {
                      final result = await Get.toNamed(
                        AppRoutes.editDiscount,
                        arguments: discount,
                      );
                      if (result == true) c.loadDiscounts();
                    },
                    onDelete: () => DeleteConfirmSheet.show(
                      context: context,
                      title: 'Remove Discount?',
                      subtitle:
                          'Remove ${discount.displayValue} discount on ${discount.targetName}?',
                      onConfirm: () => c.deleteDiscount(discount.id),
                    ),
                  );
                },
              ),
            );
          }),
        ),
      ],
    );
  }
}

class _DiscountCard extends StatelessWidget {
  final DiscountModel discount;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  const _DiscountCard({
    required this.discount,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isItem = discount.type == 'item';
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: (isItem ? AppColors.info : AppColors.warning).withValues(
                alpha: 0.1,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isItem ? Icons.inventory_2_outlined : Icons.person_outline,
              color: isItem ? AppColors.info : AppColors.warning,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  discount.targetName,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    StatusBadge(
                      label: discount.type.toUpperCase(),
                      color: isItem
                          ? AppColors.infoLight
                          : AppColors.warningLight,
                      textColor: isItem ? AppColors.info : AppColors.warning,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      discount.displayValue,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.accent,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          AppPopupMenu(onEdit: onEdit, onDelete: onDelete),
        ],
      ),
    );
  }
}
