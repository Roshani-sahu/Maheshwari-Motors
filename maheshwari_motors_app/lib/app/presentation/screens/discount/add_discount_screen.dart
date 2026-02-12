import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../../data/models/discount_model.dart';
import '../../controllers/add_discount_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class AddDiscountScreen extends StatelessWidget {
  const AddDiscountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.find<AddDiscountController>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(c.isEdit ? 'Edit Discount' : 'Add Discount')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: c.formKey,
          child: Obx(() {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Fields marked with * are required',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                    fontStyle: FontStyle.italic,
                  ),
                ),
                const SizedBox(height: 16),

                if (!c.isEdit) ...[
                  _sectionLabel(context, 'Discount Type *'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: DiscountModel.typeOptions.map((t) {
                      return _TypeChip(
                        label: _typeLabel(t),
                        icon: _typeIcon(t),
                        selected: c.type.value == t,
                        onTap: () {
                          c.type.value = t;
                          c.selectedItemId.value = null;
                          c.selectedPartyId.value = null;
                          c.selectedItemIds.clear();
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),

                  if (c.isLoadingData.value)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 16,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.inputBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Row(
                        children: [
                          SizedBox(
                            height: 16,
                            width: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          SizedBox(width: 12),
                          Text(
                            'Loading…',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    )
                  else ...[
                    if (c.needsItem) ...[
                      _sectionLabel(context, 'Select Item *'),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        initialValue: c.selectedItemId.value,
                        decoration: const InputDecoration(
                          hintText: 'Select an item',
                          prefixIcon: Icon(
                            Icons.inventory_2_outlined,
                            size: 20,
                          ),
                        ),
                        isExpanded: true,
                        items: c.items
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
                        onChanged: (id) => c.selectedItemId.value = id,
                      ),
                      const SizedBox(height: 16),
                    ],

                    if (c.needsParty) ...[
                      _sectionLabel(context, 'Select Party *'),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        initialValue: c.selectedPartyId.value,
                        decoration: const InputDecoration(
                          hintText: 'Select a party',
                          prefixIcon: Icon(Icons.person_outline, size: 20),
                        ),
                        isExpanded: true,
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
                        onChanged: (id) => c.selectedPartyId.value = id,
                      ),
                      const SizedBox(height: 16),
                    ],

                    if (c.needsItemGroup) ...[
                      _sectionLabel(context, 'Item Group Name *'),
                      const SizedBox(height: 8),
                      AppTextField(
                        label: 'Group Name',
                        controller: c.itemGroupNameC,
                        hint: 'e.g. Bearings',
                      ),
                      const SizedBox(height: 16),
                    ],
                  ],
                  const SizedBox(height: 4),
                ],

                if (!c.needsProfitPercent) ...[
                  _sectionLabel(context, 'Discount Values'),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: AppTextField(
                          label: 'Percent 1 (%)',
                          controller: c.percent1C,
                          hint: 'e.g. 10',
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: AppTextField(
                          label: 'Percent 2 (%)',
                          controller: c.percent2C,
                          hint: 'e.g. 5',
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    label: 'Fixed Amount (₹)',
                    controller: c.fixedAmountC,
                    hint: 'e.g. 100',
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                  ),
                ],

                if (c.needsProfitPercent) ...[
                  _sectionLabel(context, 'Profit Margin'),
                  const SizedBox(height: 8),
                  AppTextField(
                    label: 'Profit Percent (%) *',
                    controller: c.profitPercentC,
                    hint: 'e.g. 15',
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) {
                        return 'Profit percent is required';
                      }
                      final n = double.tryParse(v.trim());
                      if (n == null || n <= 0) {
                        return 'Enter a valid number';
                      }
                      return null;
                    },
                  ),
                ],

                const SizedBox(height: 32),

                AppButton(
                  text: c.isEdit ? 'Update Discount' : 'Create Discount',
                  isLoading: c.isLoading.value,
                  onPressed: c.submit,
                ),
              ],
            );
          }),
        ),
      ),
    );
  }

  static Widget _sectionLabel(BuildContext context, String text) {
    return Text(
      text,
      style: Theme.of(context).textTheme.titleSmall?.copyWith(
        color: AppColors.textPrimary,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  static String _typeLabel(String type) {
    switch (type) {
      case 'item':
        return 'Item';
      case 'party_item':
        return 'Party+Item';
      case 'party_all':
        return 'Party All';
      case 'item_group':
        return 'Group';
      case 'profit_margin':
        return 'Profit';
      default:
        return type;
    }
  }

  static IconData _typeIcon(String type) {
    switch (type) {
      case 'item':
        return Icons.inventory_2_outlined;
      case 'party_item':
        return Icons.people_outline;
      case 'party_all':
        return Icons.person_outline;
      case 'item_group':
        return Icons.category_outlined;
      case 'profit_margin':
        return Icons.trending_up;
      default:
        return Icons.percent;
    }
  }
}

class _TypeChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _TypeChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
        decoration: BoxDecoration(
          color: selected ? AppColors.accentLight : AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppColors.accent : AppColors.border,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: selected ? AppColors.accent : AppColors.textSecondary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                color: selected ? AppColors.accent : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
