import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../data/models/challan_model.dart';
import '../../../shared/widgets/common_widgets.dart';

class ChallanCard extends StatelessWidget {
  final ChallanModel challan;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  const ChallanCard({
    super.key,
    required this.challan,
    this.onEdit,
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
                  '#${challan.challanNo}',
                  style: const TextStyle(
                    color: AppColors.accent,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
              const Spacer(),
              StatusBadge(
                label: challan.isGst == 1 ? 'GST' : 'NON_GST',
                color: challan.isGst == 1
                    ? AppColors.accentLight
                    : AppColors.warningLight,
                textColor: challan.isGst == 1
                    ? AppColors.accent
                    : AppColors.warning,
              ),
              const SizedBox(width: 6),
              if (challan.convertedToBill)
                const StatusBadge(
                  label: 'BILLED',
                  color: AppColors.successLight,
                  textColor: AppColors.success,
                )
              else
                const StatusBadge(
                  label: 'OPEN',
                  color: AppColors.warningLight,
                  textColor: AppColors.warning,
                ),
              const SizedBox(width: 4),
              AppPopupMenu(onEdit: onEdit, onDelete: onDelete),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(
                Icons.person_outline,
                size: 16,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  challan.partyName ?? 'N/A',
                  style: Theme.of(context).textTheme.bodyMedium,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                Icons.calendar_today,
                size: 14,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Text(
                AppFormatters.dateShort(challan.date),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                '${challan.items.length} items',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              if (challan.linkedChallanId != null) ...[
                const SizedBox(width: 8),
                Icon(Icons.link, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 2),
                Text(
                  'Linked',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
              const Spacer(),
              Text(
                AppFormatters.currency(challan.amount),
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
