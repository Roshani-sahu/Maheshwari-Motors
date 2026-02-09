import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/validators.dart';
import '../../controllers/add_firm_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class AddFirmScreen extends StatelessWidget {
  const AddFirmScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<AddFirmController>();

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(title: Text(controller.isEdit ? 'Edit Firm' : 'Add Firm')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: controller.formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.accentLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(
                    Icons.business,
                    size: 36,
                    color: AppColors.accent,
                  ),
                ),
              ),
              const SizedBox(height: 28),

              // Firm type selector
              Text(
                'Firm Type',
                style: Theme.of(
                  context,
                ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 10),
              Obx(
                () => Row(
                  children: [
                    _TypeChip(
                      label: 'NON-GST',
                      selected: controller.firmType.value == 'NON_GST',
                      onTap: () => controller.firmType.value = 'NON_GST',
                    ),
                    const SizedBox(width: 12),
                    _TypeChip(
                      label: 'GST',
                      selected: controller.firmType.value == 'GST',
                      onTap: () => controller.firmType.value = 'GST',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              AppTextField(
                label: 'Firm Name *',
                controller: controller.nameCtrl,
                hint: 'Enter firm name',
                validator: (v) =>
                    v == null || v.isEmpty ? 'Name is required' : null,
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'Phone',
                      controller: controller.phoneCtrl,
                      hint: 'Phone number',
                      keyboardType: TextInputType.phone,
                      validator: AppValidators.phone,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      label: 'Email',
                      controller: controller.emailCtrl,
                      hint: 'Email address',
                      keyboardType: TextInputType.emailAddress,
                      validator: AppValidators.email,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              AppTextField(
                label: 'Address',
                controller: controller.addressCtrl,
                hint: 'Street address',
                maxLines: 2,
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'City',
                      controller: controller.cityCtrl,
                      hint: 'City',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      label: 'State',
                      controller: controller.stateCtrl,
                      hint: 'State',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Show GSTIN field for GST firms
              Obx(() {
                if (controller.firmType.value != 'GST') {
                  return const SizedBox.shrink();
                }
                return Column(
                  children: [
                    AppTextField(
                      label: 'GSTIN',
                      controller: controller.gstinCtrl,
                      hint: 'Enter GST Number',
                      validator: AppValidators.gstin,
                    ),
                    const SizedBox(height: 16),
                  ],
                );
              }),

              const SizedBox(height: 16),

              Obx(
                () => AppButton(
                  text: controller.isEdit ? 'Update Firm' : 'Create Firm',
                  isLoading: controller.isLoading.value,
                  onPressed: controller.submit,
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
  final bool selected;
  final VoidCallback onTap;
  const _TypeChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? AppColors.accent : AppColors.background,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.accent : AppColors.border,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: selected ? AppColors.white : AppColors.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
