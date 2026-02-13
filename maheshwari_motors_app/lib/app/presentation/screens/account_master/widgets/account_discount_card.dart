import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/discount_model.dart';
import '../../../shared/widgets/common_widgets.dart';

class AccountDiscountCard extends StatelessWidget {
  final DiscountModel discount;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  const AccountDiscountCard({
    super.key,
    required this.discount,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    Color iconBgColor;
    Color iconColor;
    IconData typeIcon;
    switch (discount.type) {
      case 'item':
        iconBgColor = AppColors.info.withValues(alpha: 0.1);
        iconColor = AppColors.info;
        typeIcon = Icons.inventory_2_outlined;
        break;
      case 'party_item':
        iconBgColor = AppColors.warning.withValues(alpha: 0.1);
        iconColor = AppColors.warning;
        typeIcon = Icons.people_outline;
        break;
      case 'party_all':
        iconBgColor = AppColors.warning.withValues(alpha: 0.1);
        iconColor = AppColors.warning;
        typeIcon = Icons.person_outline;
        break;
      case 'item_group':
        iconBgColor = Colors.orange.withValues(alpha: 0.1);
        iconColor = Colors.orange;
        typeIcon = Icons.category_outlined;
        break;
      case 'profit_margin':
        iconBgColor = Colors.purple.withValues(alpha: 0.1);
        iconColor = Colors.purple;
        typeIcon = Icons.trending_up;
        break;
      default:
        iconBgColor = AppColors.info.withValues(alpha: 0.1);
        iconColor = AppColors.info;
        typeIcon = Icons.percent;
    }

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(typeIcon, color: iconColor, size: 20),
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
                      label: discount.typeLabel,
                      color: iconBgColor,
                      textColor: iconColor,
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
