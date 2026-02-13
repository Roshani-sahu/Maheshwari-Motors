import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../controllers/bill/generate_bill_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/bill_placeholder.dart';
import 'widgets/bill_summary_row.dart';
import 'widgets/challan_tile.dart';

class GenerateBillScreen extends StatelessWidget {
  const GenerateBillScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.find<GenerateBillController>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Generate Bill')),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Select Party',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Obx(() {
                    if (c.isLoadingParties.value) {
                      return _loadingBox('Loading parties…');
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

                  Obx(() {
                    if (c.selectedParty.value == null) {
                      return const BillPlaceholder(
                        icon: Icons.receipt_long_outlined,
                        text: 'Select a party to see unbilled challans',
                      );
                    }
                    if (c.isLoadingChallans.value) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(40),
                          child: CircularProgressIndicator(),
                        ),
                      );
                    }
                    if (c.challans.isEmpty) {
                      return const EmptyState(
                        icon: Icons.receipt_long_outlined,
                        title: 'No unbilled challans',
                        subtitle: 'All challans for this party are billed',
                      );
                    }
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Select Challans',
                              style: Theme.of(context).textTheme.titleSmall
                                  ?.copyWith(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                            const Spacer(),
                            TextButton(
                              onPressed: c.selectAll,
                              child: Obx(
                                () => Text(
                                  c.selectedChallanIds.length ==
                                          c.challans.length
                                      ? 'Deselect All'
                                      : 'Select All',
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ...c.challans.map(
                          (ch) => ChallanTile(
                            challan: ch,
                            isSelected: c.selectedChallanIds.contains(ch.id),
                            onToggle: () => c.toggleChallan(ch.id),
                          ),
                        ),
                      ],
                    );
                  }),

                  const SizedBox(height: 16),

                  Obx(() {
                    if (c.selectedParty.value == null || c.partyBalance == 0) {
                      return const SizedBox.shrink();
                    }
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.infoLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.info.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Apply Party Balance',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                Text(
                                  'Balance: ${AppFormatters.currencyDecimal(c.partyBalance)}',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.info,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Obx(
                            () => Switch(
                              value: c.applyBalance.value,
                              onChanged: (v) => c.applyBalance.value = v,
                              activeThumbColor: AppColors.accent,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),

                  const SizedBox(height: 16),

                  Obx(() {
                    if (c.selectedChallanIds.isEmpty) {
                      return const SizedBox.shrink();
                    }
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.warningLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.warning.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Partial Delivery',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    Text(
                                      'Party taking fewer items than billed?',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Obx(
                                () => Switch(
                                  value: c.partialDelivery.value,
                                  onChanged: (v) {
                                    c.partialDelivery.value = v;
                                    if (!v) c.deliveredAmountC.clear();
                                  },
                                  activeTrackColor: AppColors.warning,
                                ),
                              ),
                            ],
                          ),
                          Obx(() {
                            if (!c.partialDelivery.value) {
                              return const SizedBox.shrink();
                            }
                            return Padding(
                              padding: const EdgeInsets.only(top: 12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  TextFormField(
                                    controller: c.deliveredAmountC,
                                    keyboardType:
                                        const TextInputType.numberWithOptions(
                                          decimal: true,
                                        ),
                                    decoration: InputDecoration(
                                      labelText: 'Delivered Amount (₹)',
                                      hintText: AppFormatters.currencyDecimal(
                                        c.finalAmount,
                                      ),
                                      prefixIcon: const Icon(
                                        Icons.local_shipping_outlined,
                                        size: 20,
                                      ),
                                      filled: true,
                                      fillColor: AppColors.white,
                                    ),
                                    onChanged: (_) =>
                                        c.partialDelivery.refresh(),
                                  ),
                                  const SizedBox(height: 8),
                                  Obx(() {
                                    final undelivered = c.undeliveredAmount;
                                    if (undelivered <= 0) {
                                      return const SizedBox.shrink();
                                    }
                                    return Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: AppColors.infoLight,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(
                                            Icons.info_outline,
                                            size: 16,
                                            color: AppColors.info,
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              '${AppFormatters.currencyDecimal(undelivered)} will be added to party\'s prepaid balance for future bills.',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: AppColors.info,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }),
                                ],
                              ),
                            );
                          }),
                        ],
                      ),
                    );
                  }),

                  const SizedBox(height: 16),

                  Obx(() {
                    if (c.selectedChallanIds.isEmpty) {
                      return const SizedBox.shrink();
                    }
                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        children: [
                          BillSummaryRow(
                            label: 'Challans Selected',
                            value:
                                '${c.selectedChallanIds.length} of ${c.challans.length}',
                          ),
                          const SizedBox(height: 8),
                          BillSummaryRow(
                            label: 'Total Amount',
                            value: AppFormatters.currencyDecimal(c.totalAmount),
                          ),
                          if (c.applyBalance.value && c.partyBalance != 0) ...[
                            const SizedBox(height: 8),
                            BillSummaryRow(
                              label: 'Balance Applied',
                              value:
                                  '- ${AppFormatters.currencyDecimal(c.partyBalance)}',
                              valueColor: AppColors.info,
                            ),
                          ],
                          if (c.partialDelivery.value &&
                              c.undeliveredAmount > 0) ...[
                            const SizedBox(height: 8),
                            BillSummaryRow(
                              label: 'Undelivered → Prepaid',
                              value:
                                  '- ${AppFormatters.currencyDecimal(c.undeliveredAmount)}',
                              valueColor: AppColors.warning,
                            ),
                          ],
                          const Divider(height: 20),
                          BillSummaryRow(
                            label: 'Bill Amount',
                            value: AppFormatters.currencyDecimal(c.billAmount),
                            isBold: true,
                            valueColor: AppColors.accent,
                          ),
                        ],
                      ),
                    );
                  }),

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
                text: 'Generate Bill',
                isLoading: c.isLoading.value,
                onPressed: c.submit,
                icon: Icons.receipt_rounded,
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
