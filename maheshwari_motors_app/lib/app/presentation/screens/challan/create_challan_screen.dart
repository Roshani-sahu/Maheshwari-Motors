import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../controllers/challan/create_challan_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/challan_line_item_card.dart';
import 'widgets/loading_dropdown.dart';
import 'widgets/section_title.dart';
import 'widgets/summary_card.dart';

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
                  SectionTitle(title: 'Party'),
                  const SizedBox(height: 8),
                  Obx(() {
                    if (c.isLoadingParties.value) {
                      return const LoadingDropdown(label: 'Loading parties…');
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
                  const SizedBox(height: 20),

                  Row(
                    children: [
                      const SectionTitle(title: 'Items'),
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
                        return ChallanLineItemCard(
                          index: i,
                          line: c.lineItems[i],
                          items: c.items,
                          isLoadingItems: c.isLoadingItems.value,
                          onItemSelected: (item) => c.onItemSelected(i, item),
                          onRemove: c.lineItems.length > 1
                              ? () => c.removeLineItem(i)
                              : null,
                          onChanged: c.onFieldChanged,
                          onGstToggled: (v) => c.onGstToggled(i, v),
                        );
                      }),
                    );
                  }),

                  const SizedBox(height: 20),

                  const SectionTitle(title: 'Challan Discount (%)'),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: c.challanDiscountC,
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                          decoration: const InputDecoration(
                            hintText: 'Enter discount %',
                            prefixIcon: Icon(Icons.percent, size: 20),
                          ),
                          onChanged: (_) => c.onFieldChanged(),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  Obx(
                    () => ChallanSummaryCard(
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
