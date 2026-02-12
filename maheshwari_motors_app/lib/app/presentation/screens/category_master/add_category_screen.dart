import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/add_category_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class AddCategoryScreen extends GetView<AddCategoryController> {
  const AddCategoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(controller.isEdit ? 'Edit Category' : 'Add Category'),
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
                label: 'Category Name *',
                validator: (v) => v?.trim().isEmpty == true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: controller.descriptionCtrl,
                label: 'Description',
                hint: 'Optional description',
                maxLines: 3,
              ),
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
