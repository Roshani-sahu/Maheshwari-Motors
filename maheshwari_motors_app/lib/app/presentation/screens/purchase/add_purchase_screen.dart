import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../controllers/purchase/add_purchase_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/purchase_line_item_card.dart';
import 'widgets/purchase_section_title.dart';

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
                  PurchaseSectionTitle(title: 'Supplier'),
                  const SizedBox(height: 8),
                  Obx(() {
                    if (c.isLoadingData.value) {
                      return loadingBox('Loading suppliers…');
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

                  PurchaseSectionTitle(title: 'Purchase Type'),
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
                      const PurchaseSectionTitle(title: 'Items'),
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
                        return PurchaseLineItemCard(
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

  static Widget loadingBox(String label) {
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
