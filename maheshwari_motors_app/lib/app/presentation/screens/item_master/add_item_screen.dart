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
                label: 'Item Name *',
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
              // Selected categories as chips + add button
              Obx(() {
                final selectedCats = controller.categoryList
                    .where((c) => controller.selectedCategoryIds.contains(c.id))
                    .toList();
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        ...selectedCats.map(
                          (cat) => Chip(
                            label: Text(cat.name),
                            deleteIcon: const Icon(Icons.close, size: 16),
                            onDeleted: () =>
                                controller.selectedCategoryIds.remove(cat.id),
                            backgroundColor: AppColors.accent.withValues(
                              alpha: 0.12,
                            ),
                            side: BorderSide(
                              color: AppColors.accent.withValues(alpha: 0.3),
                            ),
                            labelStyle: const TextStyle(
                              color: AppColors.accent,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        ActionChip(
                          avatar: const Icon(Icons.add, size: 18),
                          label: const Text('Add Category'),
                          onPressed: () =>
                              _showCategoryPicker(context, controller),
                          backgroundColor: AppColors.surface,
                          side: BorderSide(color: AppColors.border),
                        ),
                      ],
                    ),
                    if (selectedCats.isEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          'Tap "Add Category" to select categories',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: AppColors.textSecondary),
                        ),
                      ),
                  ],
                );
              }),
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
                label: 'Amount (₹) *',
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

              // GST / NON_GST item type
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

  void _showCategoryPicker(BuildContext context, AddItemController controller) {
    final searchQuery = ''.obs;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        height: MediaQuery.of(context).size.height * 0.65,
        decoration: const BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Text(
                    'Select Categories',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Done'),
                  ),
                ],
              ),
            ),
            // Search bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Search categories...',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onChanged: (v) => searchQuery.value = v,
              ),
            ),
            const SizedBox(height: 8),
            // Category list
            Expanded(
              child: Obx(() {
                final query = searchQuery.value.toLowerCase();
                final filtered = controller.categoryList
                    .where((c) => c.name.toLowerCase().contains(query))
                    .toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Text(
                      'No categories found',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  );
                }

                return ListView.builder(
                  itemCount: filtered.length,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  itemBuilder: (_, i) {
                    final cat = filtered[i];
                    return Obx(() {
                      final isSelected = controller.selectedCategoryIds
                          .contains(cat.id);
                      return ListTile(
                        leading: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.accent
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: isSelected
                                  ? AppColors.accent
                                  : AppColors.border,
                              width: 2,
                            ),
                          ),
                          child: isSelected
                              ? const Icon(
                                  Icons.check,
                                  size: 16,
                                  color: AppColors.white,
                                )
                              : null,
                        ),
                        title: Text(
                          cat.name,
                          style: TextStyle(
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.w400,
                            color: isSelected
                                ? AppColors.accent
                                : AppColors.textPrimary,
                          ),
                        ),
                        dense: true,
                        onTap: () {
                          if (isSelected) {
                            controller.selectedCategoryIds.remove(cat.id);
                          } else {
                            controller.selectedCategoryIds.add(cat.id);
                          }
                        },
                      );
                    });
                  },
                );
              }),
            ),
          ],
        ),
      ),
    );
  }
}
