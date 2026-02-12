import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../controllers/create_challan_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class CreateChallanScreen extends StatelessWidget {
  const CreateChallanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.find<CreateChallanController>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(c.isEdit ? 'Edit Challan' : 'Create Challan')),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _SectionTitle(title: 'Party'),
                  const SizedBox(height: 8),
                  Obx(() {
                    if (c.isLoadingParties.value) {
                      return const _LoadingDropdown(label: 'Loading parties…');
                    }
                    return DropdownButtonFormField<String>(
                      initialValue: c.selectedParty.value?.id,
                      decoration: const InputDecoration(
                        hintText: 'Select a party',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                      items: c.parties
                          .map(
                            (p) => DropdownMenuItem(
                              value: p.id,
                              child: Text(
                                p.name,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (id) {
                        final party = c.parties.firstWhereOrNull(
                          (p) => p.id == id,
                        );
                        c.onPartySelected(party);
                      },
                    );
                  }),
                  Obx(() {
                    if (c.autoPartyDiscountLabel != null &&
                        c.selectedParty.value != null) {
                      return Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: _AutoDiscountChip(
                          label: c.autoPartyDiscountLabel!,
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  }),

                  const SizedBox(height: 20),

                  Row(
                    children: [
                      const _SectionTitle(title: 'Items'),
                      const Spacer(),
                      TextButton.icon(
                        onPressed: c.addLineItem,
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Add Item'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Obx(() {
                    return Column(
                      children: List.generate(c.lineItems.length, (i) {
                        return _LineItemCard(
                          index: i,
                          line: c.lineItems[i],
                          items: c.items,
                          isLoadingItems: c.isLoadingItems.value,
                          onItemSelected: (item) => c.onItemSelected(i, item),
                          onRemove: c.lineItems.length > 1
                              ? () => c.removeLineItem(i)
                              : null,
                          onChanged: c.onFieldChanged,
                        );
                      }),
                    );
                  }),

                  const SizedBox(height: 20),

                  const _SectionTitle(title: 'Challan Discount (%)'),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: c.challanDiscountC,
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                          decoration: InputDecoration(
                            hintText: c.autoPartyDiscountLabel != null
                                ? 'Auto: ${c.autoPartyDiscountLabel}'
                                : 'Enter discount %',
                            prefixIcon: const Icon(Icons.percent, size: 20),
                          ),
                          onChanged: (_) => c.onFieldChanged(),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  Obx(
                    () => _SummaryCard(
                      grossTotal: c.grossTotal.value,
                      subTotal: c.subTotal.value,
                      challanDiscount: c.challanDiscountAmount.value,
                      finalAmount: c.finalAmount.value,
                    ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            decoration: const BoxDecoration(
              color: AppColors.white,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: Obx(
              () => AppButton(
                text: c.isEdit ? 'Update Challan' : 'Create Challan',
                isLoading: c.isLoading.value,
                onPressed: c.submit,
                icon: Icons.check_rounded,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleSmall?.copyWith(
        color: AppColors.textPrimary,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}

class _LoadingDropdown extends StatelessWidget {
  final String label;
  const _LoadingDropdown({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.inputBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const SizedBox(
            height: 16,
            width: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          const SizedBox(width: 12),
          Text(label, style: TextStyle(color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}

class _AutoDiscountChip extends StatelessWidget {
  final String label;
  const _AutoDiscountChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.successLight,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.auto_awesome, size: 14, color: AppColors.success),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.success,
            ),
          ),
        ],
      ),
    );
  }
}

class _LineItemCard extends StatelessWidget {
  final int index;
  final ChallanLineItem line;
  final List items;
  final bool isLoadingItems;
  final ValueChanged onItemSelected;
  final VoidCallback? onRemove;
  final VoidCallback onChanged;

  const _LineItemCard({
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
            const _LoadingDropdown(label: 'Loading items…')
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
              child: _AutoDiscountChip(label: line.autoDiscountLabel!),
            ),

          const SizedBox(height: 10),

          if (line.item != null)
            Obx(() => Row(
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
                            label: const Text('GST', style: TextStyle(fontSize: 12)),
                            icon: const Icon(Icons.receipt_long, size: 14),
                          ),
                          ButtonSegment(
                            value: 0,
                            label: const Text('NON_GST', style: TextStyle(fontSize: 12)),
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
                )),

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
                child: _MiniField(
                  label: 'Qty',
                  controller: line.quantityC,
                  onChanged: (_) => onChanged(),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MiniField(
                  label: 'Rate (₹)',
                  controller: line.rateC,
                  onChanged: (_) => onChanged(),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MiniField(
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

class _MiniField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String? hint;
  final ValueChanged<String>? onChanged;

  const _MiniField({
    required this.label,
    required this.controller,
    this.hint,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 4),
        TextFormField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          style: const TextStyle(fontSize: 14),
          decoration: InputDecoration(
            hintText: hint ?? '0',
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 10,
              vertical: 10,
            ),
            isDense: true,
          ),
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final double grossTotal;
  final double subTotal;
  final double challanDiscount;
  final double finalAmount;

  const _SummaryCard({
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
          _SummaryRow(
            label: 'Gross Total',
            value: AppFormatters.currencyDecimal(grossTotal),
          ),
          const SizedBox(height: 8),
          _SummaryRow(
            label: 'After Item Discounts',
            value: AppFormatters.currencyDecimal(subTotal),
          ),
          if (challanDiscount > 0) ...[
            const SizedBox(height: 8),
            _SummaryRow(
              label: 'Challan Discount',
              value: '- ${AppFormatters.currencyDecimal(challanDiscount)}',
              valueColor: AppColors.error,
            ),
          ],
          const Divider(height: 20),
          _SummaryRow(
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

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;
  final Color? valueColor;

  const _SummaryRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w400,
            color: isBold ? AppColors.textPrimary : AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
            color: valueColor ?? AppColors.textPrimary,
            fontSize: isBold ? 16 : null,
          ),
        ),
      ],
    );
  }
}
