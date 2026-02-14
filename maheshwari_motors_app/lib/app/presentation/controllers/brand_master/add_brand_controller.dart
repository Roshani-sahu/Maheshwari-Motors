import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../data/models/brand_model.dart';
import '../../../data/services/api_service.dart';
import 'brand_master_controller.dart';

class AddBrandController extends GetxController {
  final formKey = GlobalKey<FormState>();
  final nameCtrl = TextEditingController();

  final ApiService _api = Get.find<ApiService>();
  final RxBool isLoading = false.obs;

  BrandModel? editBrand;
  bool get isEdit => editBrand != null;

  @override
  void onInit() {
    super.onInit();
    editBrand = Get.arguments as BrandModel?;
    if (editBrand != null) {
      nameCtrl.text = editBrand!.name;
    }
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    isLoading.value = true;

    try {
      final data = <String, dynamic>{
        'brand_name': nameCtrl.text.trim(),
      };

      if (isEdit) {
        await _api.updateBrand(editBrand!.id, data);
        Get.find<BrandMasterController>().fetchBrands();
        Get.back();
        Get.snackbar('Success', 'Brand updated successfully');
      } else {
        await _api.createBrand(data);
        Get.find<BrandMasterController>().fetchBrands();
        Get.back();
        Get.snackbar('Success', 'Brand added successfully');
      }
    } catch (e) {
      Get.snackbar('Error', e.toString());
    } finally {
      isLoading.value = false;
    }
  }

  @override
  void onClose() {
    nameCtrl.dispose();
    super.onClose();
  }
}
