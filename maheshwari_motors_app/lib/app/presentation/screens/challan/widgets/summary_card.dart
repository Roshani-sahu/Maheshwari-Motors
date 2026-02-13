import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import 'summary_row.dart';

class ChallanSummaryCard extends StatelessWidget {
  final double grossTotal;
  final double subTotal;
  final double challanDiscount;
  final double finalAmount;

  const ChallanSummaryCard({
    super.key,
    required this.grossTotal,
    required this.subTotal,
    required this.challanDiscount,
    required this.finalAmount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          ChallanSummaryRow(
            label: 'Gross Total',
            value: AppFormatters.currencyDecimal(grossTotal),
          ),
          const SizedBox(height: 8),
          ChallanSummaryRow(
            label: 'After Item Discounts',
            value: AppFormatters.currencyDecimal(subTotal),
          ),
          if (challanDiscount > 0) ...[
            const SizedBox(height: 8),
            ChallanSummaryRow(
              label: 'Challan Discount',
              value: '- ${AppFormatters.currencyDecimal(challanDiscount)}',
              valueColor: AppColors.error,
            ),
          ],
          const Divider(height: 20),
          ChallanSummaryRow(
            label: 'Final Amount',
            value: AppFormatters.currencyDecimal(finalAmount),
            isBold: true,
            valueColor: AppColors.accent,
          ),
        ],
      ),
    );
  }
}
