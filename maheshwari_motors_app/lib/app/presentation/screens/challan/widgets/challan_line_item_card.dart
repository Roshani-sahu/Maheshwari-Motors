import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../controllers/challan/challan_line_item.dart';
import 'auto_discount_chip.dart';
import 'loading_dropdown.dart';
import 'mini_field.dart';

class ChallanLineItemCard extends StatelessWidget {
  final int index;
  final ChallanLineItem line;
  final List items;
  final bool isLoadingItems;
  final ValueChanged onItemSelected;
  final VoidCallback? onRemove;
  final VoidCallback onChanged;

  const ChallanLineItemCard({
    super.key,
    required this.index,
    required this.line,
    required this.items,
    required this.isLoadingItems,
    required this.onItemSelected,
    this.onRemove,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.secondary.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.accentLight,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '#${index + 1}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.accent,
                  ),
                ),
              ),
              const Spacer(),
              if (onRemove != null)
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  color: AppColors.error,
                  onPressed: onRemove,
                  visualDensity: VisualDensity.compact,
                ),
            ],
          ),
          const SizedBox(height: 10),

          if (isLoadingItems)
            const LoadingDropdown(label: 'Loading items…')
          else
            DropdownButtonFormField(
              initialValue: line.item?.id,
              isExpanded: true,
              decoration: const InputDecoration(
                hintText: 'Select item',
                prefixIcon: Icon(Icons.inventory_2_outlined, size: 20),
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
              ),
              items: items
                  .map(
                    (item) => DropdownMenuItem(
                      value: item.id,
                      child: Text(
                        item.itemName,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (id) {
                final item = items.firstWhereOrNull((i) => i.id == id);
                onItemSelected(item);
              },
            ),

          if (line.autoDiscountLabel != null && !line.hasManualDiscount)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: AutoDiscountChip(label: line.autoDiscountLabel!),
            ),

          const SizedBox(height: 10),

          if (line.item != null)
            Obx(
              () => Row(
                children: [
                  Text(
                    'Sale Type:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: SegmentedButton<int>(
                      segments: [
                        ButtonSegment(
                          value: 1,
                          label: const Text(
                            'GST',
                            style: TextStyle(fontSize: 12),
                          ),
                          icon: const Icon(Icons.receipt_long, size: 14),
                        ),
                        ButtonSegment(
                          value: 0,
                          label: const Text(
                            'NON_GST',
                            style: TextStyle(fontSize: 12),
                          ),
                          icon: const Icon(Icons.receipt_outlined, size: 14),
                          enabled: true,
                        ),
                      ],
                      selected: {line.isGst.value},
                      onSelectionChanged: line.canToggleGst
                          ? (v) => line.isGst.value = v.first
                          : null,
                      showSelectedIcon: false,
                      style: ButtonStyle(
                        visualDensity: VisualDensity.compact,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        padding: WidgetStatePropertyAll(
                          EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

          if (line.item != null && !line.canToggleGst)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'This item is NON_GST only (set in item master)',
                style: TextStyle(
                  fontSize: 11,
                  fontStyle: FontStyle.italic,
                  color: AppColors.textSecondary,
                ),
              ),
            ),

          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: ChallanMiniField(
                  label: 'Qty',
                  controller: line.quantityC,
                  onChanged: (_) => onChanged(),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ChallanMiniField(
                  label: 'Rate (₹)',
                  controller: line.rateC,
                  onChanged: (_) => onChanged(),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ChallanMiniField(
                  label: 'Disc %',
                  controller: line.discountC,
                  hint: line.autoDiscount != null
                      ? line.autoDiscount!.toStringAsFixed(1)
                      : '0',
                  onChanged: (_) => onChanged(),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Gross: ${AppFormatters.currencyDecimal(line.grossAmount)}',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
              ),
              Text(
                AppFormatters.currencyDecimal(line.amount),
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
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
