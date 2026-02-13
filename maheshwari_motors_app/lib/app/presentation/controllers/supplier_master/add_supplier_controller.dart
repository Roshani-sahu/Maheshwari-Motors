import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/models/supplier_model.dart';
import '../../../data/services/api_service.dart';
import 'supplier_master_controller.dart';

class AddSupplierController extends GetxController {
  final formKey = GlobalKey<FormState>();
  final nameCtrl = TextEditingController();
  final phoneCtrl = TextEditingController();
  final emailCtrl = TextEditingController();
  final addressCtrl = TextEditingController();
  final cityCtrl = TextEditingController();
  final stateCtrl = TextEditingController();
  final gstinCtrl = TextEditingController();

  final ApiService _api = Get.find<ApiService>();
  final RxBool isLoading = false.obs;

  SupplierModel? editSupplier;
  bool get isEdit => editSupplier != null;

  @override
  void onInit() {
    super.onInit();
    editSupplier = Get.arguments as SupplierModel?;
    if (editSupplier != null) {
      nameCtrl.text = editSupplier!.name;
      phoneCtrl.text = editSupplier!.phone ?? '';
      emailCtrl.text = editSupplier!.email ?? '';
      addressCtrl.text = editSupplier!.address ?? '';
      cityCtrl.text = editSupplier!.city ?? '';
      stateCtrl.text = editSupplier!.state ?? '';
      gstinCtrl.text = editSupplier!.gstin ?? '';
    }
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    isLoading.value = true;

    try {
      final data = {
        'name': nameCtrl.text.trim(),
        'phone': phoneCtrl.text.trim(),
        'email': emailCtrl.text.trim(),
        'address': addressCtrl.text.trim(),
        'city': cityCtrl.text.trim(),
        'state': stateCtrl.text.trim(),
        'gstin': gstinCtrl.text.trim(),
      };

      if (isEdit) {
        await _api.updateSupplier(editSupplier!.id, data);
        Get.find<SupplierMasterController>().fetchSuppliers();
        Get.back();
        Get.snackbar('Success', 'Supplier updated successfully');
      } else {
        await _api.createSupplier(data);
        Get.find<SupplierMasterController>().fetchSuppliers();
        Get.back();
        Get.snackbar('Success', 'Supplier added successfully');
      }
    } catch (e) {
      Get.snackbar('Error', e.toString());
    } finally {
      isLoading.value = false;
    }
  }
}
