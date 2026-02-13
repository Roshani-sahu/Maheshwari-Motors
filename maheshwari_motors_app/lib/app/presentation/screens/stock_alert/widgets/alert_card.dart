import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../data/models/item_model.dart';
import '../../../shared/widgets/common_widgets.dart';
import 'stock_info.dart';

class AlertCard extends StatelessWidget {
  final ItemModel item;
  const AlertCard({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.itemName,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
              StatusBadge.stock(item.stockStatus),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              StockInfo(
                label: 'Total Stock',
                value: AppFormatters.quantity(item.totalStock),
                color: item.isLowStock ? AppColors.error : AppColors.success,
              ),
              const SizedBox(width: 24),
              StockInfo(
                label: 'Threshold',
                value: AppFormatters.quantity(item.threshold),
                color: AppColors.textSecondary,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
