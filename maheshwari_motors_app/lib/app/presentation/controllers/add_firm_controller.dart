import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/firm_model.dart';
import '../../data/services/api_service.dart';
import '../shared/widgets/common_widgets.dart';

class AddFirmController extends GetxController {
  final formKey = GlobalKey<FormState>();
  final nameCtrl = TextEditingController();
  final phoneCtrl = TextEditingController();
  final emailCtrl = TextEditingController();
  final addressCtrl = TextEditingController();
  final godownAddressCtrl = TextEditingController();
  final cityCtrl = TextEditingController();
  final stateCtrl = TextEditingController();
  final gstinCtrl = TextEditingController();
  final cinCtrl = TextEditingController();
  final regNumberCtrl = TextEditingController();
  final bankNameCtrl = TextEditingController();
  final bankBranchCtrl = TextEditingController();
  final ifscCodeCtrl = TextEditingController();
  final accountNumberCtrl = TextEditingController();

  final ApiService _api = Get.find<ApiService>();
  final RxBool isLoading = false.obs;
  final RxString firmType = 'NON_GST'.obs;

  FirmModel? editFirm;
  bool get isEdit => editFirm != null;

  @override
  void onInit() {
    super.onInit();
    editFirm = Get.arguments as FirmModel?;
    if (editFirm != null) {
      nameCtrl.text = editFirm!.name;
      phoneCtrl.text = editFirm!.phone;
      emailCtrl.text = editFirm!.email;
      addressCtrl.text = editFirm!.address;
      godownAddressCtrl.text = editFirm!.godownAddress ?? '';
      cityCtrl.text = editFirm!.city;
      stateCtrl.text = editFirm!.state;
      gstinCtrl.text = editFirm!.gstin ?? '';
      cinCtrl.text = editFirm!.cin ?? '';
      regNumberCtrl.text = editFirm!.regNumber ?? '';
      bankNameCtrl.text = editFirm!.bankName ?? '';
      bankBranchCtrl.text = editFirm!.bankBranch ?? '';
      ifscCodeCtrl.text = editFirm!.ifscCode ?? '';
      accountNumberCtrl.text = editFirm!.accountNumber ?? '';
      firmType.value = editFirm!.type;
    }
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    isLoading.value = true;

    try {
      final data = {
        'name': nameCtrl.text.trim(),
        'type': firmType.value,
        'phone': phoneCtrl.text.trim(),
        'email': emailCtrl.text.trim(),
        'address': addressCtrl.text.trim(),
        'city': cityCtrl.text.trim(),
        'state': stateCtrl.text.trim(),
      };
      if (godownAddressCtrl.text.trim().isNotEmpty) {
        data['godown_address'] = godownAddressCtrl.text.trim();
      }
      if (gstinCtrl.text.trim().isNotEmpty) {
        data['GSTIN'] = gstinCtrl.text.trim();
      }
      if (cinCtrl.text.trim().isNotEmpty) {
        data['CIN'] = cinCtrl.text.trim();
      }
      if (regNumberCtrl.text.trim().isNotEmpty) {
        data['reg_number'] = regNumberCtrl.text.trim();
      }
      if (bankNameCtrl.text.trim().isNotEmpty) {
        data['bank_name'] = bankNameCtrl.text.trim();
      }
      if (bankBranchCtrl.text.trim().isNotEmpty) {
        data['bank_branch'] = bankBranchCtrl.text.trim();
      }
      if (ifscCodeCtrl.text.trim().isNotEmpty) {
        data['ifsc_code'] = ifscCodeCtrl.text.trim();
      }
      if (accountNumberCtrl.text.trim().isNotEmpty) {
        data['account_number'] = accountNumberCtrl.text.trim();
      }

      if (isEdit) {
        await _api.updateFirm(editFirm!.id, data);
        AppSnackbar.success('Firm updated');
      } else {
        await _api.createFirm(data);
        AppSnackbar.success('Firm created');
      }
      Get.back(result: true);
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    } finally {
      isLoading.value = false;
    }
  }

  @override
  void onClose() {
    nameCtrl.dispose();
    phoneCtrl.dispose();
    emailCtrl.dispose();
    addressCtrl.dispose();
    godownAddressCtrl.dispose();
    cityCtrl.dispose();
    stateCtrl.dispose();
    gstinCtrl.dispose();
    cinCtrl.dispose();
    regNumberCtrl.dispose();
    bankNameCtrl.dispose();
    bankBranchCtrl.dispose();
    ifscCodeCtrl.dispose();
    accountNumberCtrl.dispose();
    super.onClose();
  }
}
