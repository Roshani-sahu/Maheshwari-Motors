import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../controllers/add_discount_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class AddDiscountScreen extends StatelessWidget {
  const AddDiscountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.find<AddDiscountController>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(c.isEdit ? 'Edit Discount' : 'Add Discount'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: c.formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ─── Type Selector ────────────────────────
              if (!c.isEdit) ...[
                Text(
                  'Apply To',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 8),
                Obx(
                  () => Row(
                    children: [
                      _TypeChip(
                        label: 'Item',
                        icon: Icons.inventory_2_outlined,
                        selected: c.type.value == 'item',
                        onTap: () {
                          c.type.value = 'item';
                          c.selectedTargetId.value = null;
                        },
                      ),
                      const SizedBox(width: 12),
                      _TypeChip(
                        label: 'Party',
                        icon: Icons.person_outline,
                        selected: c.type.value == 'party',
                        onTap: () {
                          c.type.value = 'party';
                          c.selectedTargetId.value = null;
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // ─── Target Selector ──────────────────────
                Text(
                  'Select Target',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 8),
                Obx(() {
                  if (c.isLoadingData.value) {
                    return Container(
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
                            child:
                                CircularProgressIndicator(strokeWidth: 2),
                          ),
                          SizedBox(width: 12),
                          Text(
                            'Loading…',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  if (c.type.value == 'item') {
                    return DropdownButtonFormField<String>(
                      initialValue: c.selectedTargetId.value,
                      decoration: const InputDecoration(
                        hintText: 'Select an item',
                        prefixIcon:
                            Icon(Icons.inventory_2_outlined, size: 20),
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
                      onChanged: (id) =>
                          c.selectedTargetId.value = id,
                    );
                  } else {
                    return DropdownButtonFormField<String>(
                      initialValue: c.selectedTargetId.value,
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
                      onChanged: (id) =>
                          c.selectedTargetId.value = id,
                    );
                  }
                }),
                const SizedBox(height: 20),
              ],

              // ─── Discount Type ────────────────────────
              Text(
                'Discount Type',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 8),
              Obx(
                () => Row(
                  children: [
                    _TypeChip(
                      label: 'Percentage',
                      icon: Icons.percent,
                      selected: c.discountType.value == 'percentage',
                      onTap: () => c.discountType.value = 'percentage',
                    ),
                    const SizedBox(width: 12),
                    _TypeChip(
                      label: 'Fixed',
                      icon: Icons.currency_rupee,
                      selected: c.discountType.value == 'fixed',
                      onTap: () => c.discountType.value = 'fixed',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // ─── Value ────────────────────────────────
              Obx(
                () => AppTextField(
                  label: c.discountType.value == 'percentage'
                      ? 'Discount Percentage *'
                      : 'Discount Amount (₹) *',
                  controller: c.valueC,
                  hint: c.discountType.value == 'percentage'
                      ? 'e.g. 5'
                      : 'e.g. 100',
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'Value is required';
                    }
                    final n = double.tryParse(v.trim());
                    if (n == null || n <= 0) {
                      return 'Enter a valid number';
                    }
                    return null;
                  },
                ),
              ),

              const SizedBox(height: 32),

              Obx(
                () => AppButton(
                  text: c.isEdit
                      ? 'Update Discount'
                      : 'Create Discount',
                  isLoading: c.isLoading.value,
                  onPressed: c.submit,
                ),
              ),
            ],
          ),
        ),
      ),
    );
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
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? AppColors.accentLight : AppColors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.accent : AppColors.border,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 18,
                color:
                    selected ? AppColors.accent : AppColors.textSecondary,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontWeight:
                      selected ? FontWeight.w600 : FontWeight.w400,
                  color: selected
                      ? AppColors.accent
                      : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
