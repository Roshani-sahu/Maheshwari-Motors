import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/item_master/add_item_controller.dart';
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

              Text(
                'Fields marked with * are required',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                  fontStyle: FontStyle.italic,
                ),
              ),
              const SizedBox(height: 16),

              AppTextField(
                label: 'Item Name *',
                hint: 'Enter item name',
                controller: controller.nameController,
                validator: (v) => v == null || v.trim().isEmpty
                    ? 'Item name is required'
                    : null,
              ),
              const SizedBox(height: 18),

              Obx(
                () => DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  initialValue:
                      controller.categoryList.any(
                        (c) => c.id == controller.selectedCategoryId.value,
                      )
                      ? controller.selectedCategoryId.value
                      : null,
                  items: [
                    const DropdownMenuItem<String>(
                      value: null,
                      child: Text('None'),
                    ),
                    ...controller.categoryList.map((cat) {
                      return DropdownMenuItem(
                        value: cat.id,
                        child: Text(cat.name),
                      );
                    }),
                  ],
                  onChanged: (val) => controller.selectedCategoryId.value = val,
                ),
              ),
              const SizedBox(height: 18),

              Obx(
                () => DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Brand',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  initialValue:
                      controller.brandList.any(
                        (b) => b.id == controller.selectedBrandId.value,
                      )
                      ? controller.selectedBrandId.value
                      : null,
                  items: [
                    const DropdownMenuItem<String>(
                      value: null,
                      child: Text('None'),
                    ),
                    ...controller.brandList.map((brand) {
                      return DropdownMenuItem(
                        value: brand.id,
                        child: Text(brand.name),
                      );
                    }),
                  ],
                  onChanged: (val) => controller.selectedBrandId.value = val,
                ),
              ),
              const SizedBox(height: 18),

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
                label: 'Sale Rate (₹) *',
                hint: 'Enter sale rate',
                controller: controller.saleRateController,
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'Sale rate is required';
                  }
                  if (double.tryParse(v.trim()) == null) {
                    return 'Invalid amount';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 18),

              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'Purchase Rate (₹)',
                      hint: '0',
                      controller: controller.purchaseRateController,
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v != null &&
                            v.trim().isNotEmpty &&
                            double.tryParse(v.trim()) == null) {
                          return 'Invalid';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: AppTextField(
                      label: 'MRP Rate (₹)',
                      hint: '0',
                      controller: controller.mrpRateController,
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v != null &&
                            v.trim().isNotEmpty &&
                            double.tryParse(v.trim()) == null) {
                          return 'Invalid';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'GST %',
                      hint: '0',
                      controller: controller.gstPercentController,
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v != null &&
                            v.trim().isNotEmpty &&
                            double.tryParse(v.trim()) == null) {
                          return 'Invalid';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: AppTextField(
                      label: 'Discount %',
                      hint: '0',
                      controller: controller.discountController,
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v != null &&
                            v.trim().isNotEmpty &&
                            double.tryParse(v.trim()) == null) {
                          return 'Invalid';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
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

              Text(
                'Item Type',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              Obx(
                () => SegmentedButton<int>(
                  segments: const [
                    ButtonSegment(
                      value: 1,
                      label: Text('GST'),
                      icon: Icon(Icons.receipt_long, size: 16),
                    ),
                    ButtonSegment(
                      value: 0,
                      label: Text('NON_GST Only'),
                      icon: Icon(Icons.receipt_outlined, size: 16),
                    ),
                  ],
                  selected: {controller.isGst.value},
                  onSelectionChanged: (v) => controller.isGst.value = v.first,
                  showSelectedIcon: false,
                ),
              ),
              const SizedBox(height: 6),
              Obx(
                () => Text(
                  controller.isGst.value == 1
                      ? 'This item can be sold under either GST or NON_GST firm.'
                      : 'This item can ONLY be sold under the NON_GST firm.',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
              const SizedBox(height: 18),

              AppTextField(
                label: 'Stock',
                hint: '0',
                controller: controller.stockController,
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
