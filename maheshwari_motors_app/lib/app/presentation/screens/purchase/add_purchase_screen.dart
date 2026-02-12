import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../controllers/add_purchase_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class AddPurchaseScreen extends StatelessWidget {
  const AddPurchaseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.find<AddPurchaseController>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Record Purchase')),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _SectionTitle(title: 'Supplier'),
                  const SizedBox(height: 8),
                  Obx(() {
                    if (c.isLoadingData.value) {
                      return _loadingBox('Loading suppliers…');
                    }
                    return DropdownButtonFormField<String>(
                      initialValue: c.selectedSupplier.value?.id,
                      decoration: const InputDecoration(
                        hintText: 'Select a supplier',
                        prefixIcon: Icon(Icons.store_outlined),
                      ),
                      items: c.suppliers
                          .map(
                            (s) => DropdownMenuItem(
                              value: s.id,
                              child: Text(
                                s.name,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (id) {
                        c.selectedSupplier.value = c.suppliers.firstWhereOrNull(
                          (s) => s.id == id,
                        );
                      },
                    );
                  }),

                  const SizedBox(height: 20),

                  _SectionTitle(title: 'Purchase Type'),
                  const SizedBox(height: 8),
                  Obx(
                    () => Row(
                      children: ['GST', 'NON_GST'].map((t) {
                        final selected = c.purchaseType.value == t;
                        return Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(right: t == 'GST' ? 8 : 0),
                            child: ChoiceChip(
                              label: Text(t),
                              selected: selected,
                              onSelected: (_) => c.purchaseType.value = t,
                              selectedColor: AppColors.accentLight,
                              labelStyle: TextStyle(
                                color: selected
                                    ? AppColors.accent
                                    : AppColors.textSecondary,
                                fontWeight: selected
                                    ? FontWeight.w600
                                    : FontWeight.w400,
                              ),
                              showCheckmark: false,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),

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
                          isLoading: c.isLoadingData.value,
                          onItemSelected: (item) => c.onItemSelected(i, item),
                          onRemove: c.lineItems.length > 1
                              ? () => c.removeLineItem(i)
                              : null,
                          onChanged: c.recalculate,
                        );
                      }),
                    );
                  }),

                  const SizedBox(height: 20),

                  Obx(
                    () => Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Total Amount',
                            style: Theme.of(context).textTheme.titleSmall
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                          Text(
                            AppFormatters.currencyDecimal(c.totalAmount.value),
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.accent,
                                ),
                          ),
                        ],
                      ),
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
                text: 'Record Purchase',
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

  static Widget _loadingBox(String label) {
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
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
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

class _LineItemCard extends StatelessWidget {
  final int index;
  final PurchaseLineItem line;
  final List items;
  final bool isLoading;
  final ValueChanged onItemSelected;
  final VoidCallback? onRemove;
  final VoidCallback onChanged;

  const _LineItemCard({
    required this.index,
    required this.line,
    required this.items,
    required this.isLoading,
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
          if (isLoading)
            AddPurchaseScreen._loadingBox('Loading items…')
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Amount',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Text(
                        AppFormatters.currencyDecimal(line.amount),
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.accent,
                        ),
                      ),
                    ),
                  ],
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
  final ValueChanged<String>? onChanged;

  const _MiniField({
    required this.label,
    required this.controller,
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
          decoration: const InputDecoration(
            hintText: '0',
            contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            isDense: true,
          ),
          onChanged: onChanged,
        ),
      ],
    );
  }
}
