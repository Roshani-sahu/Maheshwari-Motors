import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/models/brand_model.dart';
import '../../../data/models/category_model.dart';
import '../../../data/services/api_service.dart';
import 'category_master_controller.dart';

class AddCategoryController extends GetxController {
  final formKey = GlobalKey<FormState>();
  final nameCtrl = TextEditingController();

  final ApiService _api = Get.find<ApiService>();
  final RxBool isLoading = false.obs;
  final RxBool isLoadingBrands = true.obs;
  final RxList<BrandModel> allBrands = <BrandModel>[].obs;
  final RxSet<String> selectedBrandIds = <String>{}.obs;

  CategoryModel? editCategory;
  bool get isEdit => editCategory != null;

  @override
  void onInit() {
    super.onInit();
    editCategory = Get.arguments as CategoryModel?;
    if (editCategory != null) {
      nameCtrl.text = editCategory!.name;
      selectedBrandIds.addAll(editCategory!.brandIds);
    }
    _loadBrands();
  }

  Future<void> _loadBrands() async {
    isLoadingBrands.value = true;
    try {
      allBrands.value = await _api.getBrands();
    } catch (_) {}
    isLoadingBrands.value = false;
  }

  void toggleBrand(String brandId) {
    if (selectedBrandIds.contains(brandId)) {
      selectedBrandIds.remove(brandId);
    } else {
      selectedBrandIds.add(brandId);
    }
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    isLoading.value = true;

    try {
      final data = <String, dynamic>{
        'category_name': nameCtrl.text.trim(),
        'brands': selectedBrandIds.toList(),
      };

      if (isEdit) {
        await _api.updateCategory(editCategory!.id, data);
        Get.find<CategoryMasterController>().fetchCategories();
        Get.back();
        Get.snackbar('Success', 'Category updated successfully');
      } else {
        await _api.createCategory(data);
        Get.find<CategoryMasterController>().fetchCategories();
        Get.back();
        Get.snackbar('Success', 'Category added successfully');
      }
    } catch (e) {
      Get.snackbar('Error', e.toString());
    } finally {
      isLoading.value = false;
    }
  }
}
