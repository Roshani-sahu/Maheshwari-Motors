import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/validators.dart';
import '../../controllers/add_party_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class AddPartyScreen extends StatelessWidget {
  const AddPartyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<AddPartyController>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(controller.isEdit ? 'Edit Party' : 'Add Party'),
      ),
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
                  child: Center(
                    child: Obx(
                      () => Text(
                        controller.nameInitial.value,
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(
                              color: AppColors.accent,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 28),

              // Required fields note
              Text(
                'Fields marked with * are required',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                  fontStyle: FontStyle.italic,
                ),
              ),
              const SizedBox(height: 16),

              AppTextField(
                label: 'Party Name *',
                controller: controller.nameC,
                hint: 'Enter party name',
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'Name is required' : null,
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'Contact',
                      controller: controller.contactC,
                      hint: 'Phone number',
                      keyboardType: TextInputType.phone,
                      validator: AppValidators.phone,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      label: 'Email',
                      controller: controller.emailC,
                      hint: 'email@example.com',
                      keyboardType: TextInputType.emailAddress,
                      validator: AppValidators.email,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              AppTextField(
                label: 'Address',
                controller: controller.addressC,
                hint: 'Street address',
                maxLines: 2,
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'City',
                      controller: controller.cityC,
                      hint: 'City',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      label: 'State',
                      controller: controller.stateC,
                      hint: 'State',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              AppTextField(
                label: 'GSTIN',
                controller: controller.gstinC,
                hint: 'GST Number (optional)',
                validator: AppValidators.gstin,
              ),
              const SizedBox(height: 32),

              Obx(
                () => AppButton(
                  text: controller.isEdit ? 'Update Party' : 'Create Party',
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
