import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/category_master/add_category_controller.dart';
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
                validator: (v) =>
                    v?.trim().isEmpty == true ? 'Required' : null,
              ),
              const SizedBox(height: 20),
              Obx(() {
                final selected = controller.selectedBrandIds;
                return Text(
                  'Brands in Category (${selected.length})',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                );
              }),
              const SizedBox(height: 8),
              Obx(() {
                if (controller.isLoadingBrands.value) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                if (controller.allBrands.isEmpty) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Text(
                      'No brands available — add brands first',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: AppColors.textSecondary),
                    ),
                  );
                }
                return AppCard(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    children: controller.allBrands.map((brand) {
                      return Obx(() {
                        final isSelected =
                            controller.selectedBrandIds.contains(brand.id);
                        return CheckboxListTile(
                          dense: true,
                          contentPadding:
                              const EdgeInsets.symmetric(horizontal: 4),
                          title: Text(
                            brand.name,
                            style: const TextStyle(fontSize: 14),
                          ),
                          subtitle: Text(
                            '${brand.itemIds.length} items',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          value: isSelected,
                          onChanged: (_) => controller.toggleBrand(brand.id),
                          activeColor: AppColors.accent,
                        );
                      });
                    }).toList(),
                  ),
                );
              }),
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
