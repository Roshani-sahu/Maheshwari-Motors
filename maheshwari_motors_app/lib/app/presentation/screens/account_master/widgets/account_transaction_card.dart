import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../data/models/transaction_model.dart';
import '../../../shared/widgets/common_widgets.dart';

class AccountTransactionCard extends StatelessWidget {
  final TransactionModel txn;
  const AccountTransactionCard({super.key, required this.txn});

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
