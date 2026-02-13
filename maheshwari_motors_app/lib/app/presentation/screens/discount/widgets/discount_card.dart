import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/discount_model.dart';
import '../../../shared/widgets/common_widgets.dart';

class DiscountCard extends StatelessWidget {
  final DiscountModel discount;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const DiscountCard({
    super.key,
    required this.discount,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    Color badgeColor;
    Color badgeTextColor;
    IconData typeIcon;
    switch (discount.type) {
      case 'item':
        badgeColor = AppColors.infoLight;
        badgeTextColor = AppColors.info;
        typeIcon = Icons.inventory_2_outlined;
        break;
      case 'party_item':
        badgeColor = AppColors.successLight;
        badgeTextColor = AppColors.success;
        typeIcon = Icons.people_outline;
        break;
      case 'party_all':
        badgeColor = AppColors.successLight;
        badgeTextColor = AppColors.success;
        typeIcon = Icons.person_outline;
        break;
      case 'item_group':
        badgeColor = const Color(0xFFFFF3E0);
        badgeTextColor = Colors.orange;
        typeIcon = Icons.category_outlined;
        break;
      case 'profit_margin':
        badgeColor = const Color(0xFFF3E5F5);
        badgeTextColor = Colors.purple;
        typeIcon = Icons.trending_up;
        break;
      default:
        badgeColor = AppColors.infoLight;
        badgeTextColor = AppColors.info;
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
              color: badgeColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(typeIcon, color: badgeTextColor, size: 20),
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
                      color: badgeColor,
                      textColor: badgeTextColor,
                    ),
                    if (!discount.isActive) ...[
                      const SizedBox(width: 8),
                      const StatusBadge(
                        label: 'INACTIVE',
                        color: Color(0xFFFFEBEE),
                        textColor: Colors.red,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.accentLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              discount.displayValue,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: AppColors.accent,
              ),
            ),
          ),
          const SizedBox(width: 4),
          AppPopupMenu(onEdit: onEdit, onDelete: onDelete),
        ],
      ),
    );
  }
}
