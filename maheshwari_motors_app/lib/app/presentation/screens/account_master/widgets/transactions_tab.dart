import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../controllers/account_master/account_master_controller.dart';
import '../../../shared/widgets/common_widgets.dart';
import 'account_transaction_card.dart';

class TransactionsTab extends StatelessWidget {
  final AccountMasterController c;
  const TransactionsTab({super.key, required this.c});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
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
                itemBuilder: (_, i) =>
                    AccountTransactionCard(txn: c.filteredTxns[i]),
              ),
            );
          }),
        ),
      ],
    );
  }
}
