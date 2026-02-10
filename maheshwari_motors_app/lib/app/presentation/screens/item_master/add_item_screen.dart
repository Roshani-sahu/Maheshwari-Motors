import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/add_item_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class AddItemScreen extends StatelessWidget {
  const AddItemScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<AddItemController>();

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(title: Text(controller.isEdit ? 'Edit Item' : 'Add Item')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: controller.formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image picker
              Center(
                child: Obx(
                  () => GestureDetector(
                    onTap: controller.pickImage,
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                        image: controller.imageFile.value != null
                            ? DecorationImage(
                                image: FileImage(
                                  File(controller.imageFile.value!.path),
                                ),
                                fit: BoxFit.cover,
                              )
                            : controller.editItem?.image != null
                            ? DecorationImage(
                                image: NetworkImage(
                                  controller.editItem!.image!,
                                ),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child:
                          controller.imageFile.value == null &&
                              controller.editItem?.image == null
                          ? Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.camera_alt_outlined,
                                  color: AppColors.textSecondary,
                                  size: 28,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Add Photo',
                                  style: Theme.of(
                                    context,
                                  ).textTheme.bodySmall?.copyWith(fontSize: 11),
                                ),
                              ],
                            )
                          : null,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 28),

              AppTextField(
                label: 'Item Name',
                hint: 'Enter item name',
                controller: controller.nameController,
                validator: (v) => v == null || v.trim().isEmpty
                    ? 'Item name is required'
                    : null,
              ),
              const SizedBox(height: 18),

              // Categories
              Text(
                'Categories',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Obx(
                () => Wrap(
                  spacing: 8,
                  children: controller.categoryList.map((cat) {
                    final isSelected = controller.selectedCategoryIds.contains(
                      cat.id,
                    );
                    return FilterChip(
                      label: Text(cat.name),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) {
                          controller.selectedCategoryIds.add(cat.id);
                        } else {
                          controller.selectedCategoryIds.remove(cat.id);
                        }
                      },
                      selectedColor: AppColors.accent.withValues(alpha: 0.2),
                      checkmarkColor: AppColors.accent,
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 18),

              // Supplier
              Obx(
                () => DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Supplier',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  initialValue:
                      controller.supplierList.any(
                        (s) => s.id == controller.selectedSupplierId.value,
                      )
                      ? controller.selectedSupplierId.value
                      : null,
                  items: [
                    const DropdownMenuItem<String>(
                      value: null,
                      child: Text('None'),
                    ),
                    ...controller.supplierList.map((sup) {
                      return DropdownMenuItem(
                        value: sup.id,
                        child: Text(sup.name),
                      );
                    }),
                  ],
                  onChanged: (val) => controller.selectedSupplierId.value = val,
                ),
              ),
              const SizedBox(height: 18),

              AppTextField(
                label: 'Amount (₹)',
                hint: 'Enter price',
                controller: controller.amountController,
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'Amount is required';
                  }
                  if (double.tryParse(v.trim()) == null) {
                    return 'Invalid amount';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 18),

              AppTextField(
                label: 'Low Stock Threshold',
                hint: 'e.g., 10',
                controller: controller.thresholdController,
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v != null &&
                      v.trim().isNotEmpty &&
                      int.tryParse(v.trim()) == null) {
                    return 'Enter a valid number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 18),

              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'GST Stock',
                      hint: '0',
                      controller: controller.gstStockController,
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v != null &&
                            v.trim().isNotEmpty &&
                            int.tryParse(v.trim()) == null) {
                          return 'Invalid';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: AppTextField(
                      label: 'Non-GST Stock',
                      hint: '0',
                      controller: controller.nongstStockController,
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v != null &&
                            v.trim().isNotEmpty &&
                            int.tryParse(v.trim()) == null) {
                          return 'Invalid';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              Obx(
                () => AppButton(
                  text: controller.isEdit ? 'Update Item' : 'Create Item',
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
