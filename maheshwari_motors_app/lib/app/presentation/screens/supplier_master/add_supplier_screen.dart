import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/supplier_master/add_supplier_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class AddSupplierScreen extends GetView<AddSupplierController> {
  const AddSupplierScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(controller.isEdit ? 'Edit Supplier' : 'Add Supplier'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: controller.formKey,
          child: Column(
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
              AppTextField(
                controller: controller.nameCtrl,
                label: 'Supplier Name *',
                validator: (v) => v?.trim().isEmpty == true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: controller.phoneCtrl,
                label: 'Phone',
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: controller.emailCtrl,
                label: 'Email',
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: controller.addressCtrl,
                label: 'Address',
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      controller: controller.cityCtrl,
                      label: 'City',
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: AppTextField(
                      controller: controller.stateCtrl,
                      label: 'State',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              AppTextField(controller: controller.gstinCtrl, label: 'GSTIN'),
              const SizedBox(height: 24),
              Obx(
                () => AppButton(
                  text: controller.isEdit ? 'Update' : 'Save',
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
