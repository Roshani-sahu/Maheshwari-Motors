import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/party_model.dart';
import '../../data/services/api_service.dart';
import '../shared/widgets/common_widgets.dart';

class AddPartyController extends GetxController {
  final formKey = GlobalKey<FormState>();
  final nameC = TextEditingController();
  final contactC = TextEditingController();
  final emailC = TextEditingController();
  final addressC = TextEditingController();
  final cityC = TextEditingController();
  final stateC = TextEditingController();
  final gstinC = TextEditingController();

  final ApiService _api = Get.find<ApiService>();
  final RxBool isLoading = false.obs;
  final RxString nameInitial = 'P'.obs;

  PartyModel? editParty;
  bool get isEdit => editParty != null;

  @override
  void onInit() {
    super.onInit();
    editParty = Get.arguments as PartyModel?;
    if (editParty != null) {
      nameC.text = editParty!.name;
      contactC.text = editParty!.phone ?? '';
      emailC.text = editParty!.email ?? '';
      addressC.text = editParty!.address ?? '';
      cityC.text = editParty!.city ?? '';
      stateC.text = editParty!.state ?? '';
      gstinC.text = editParty!.gstin ?? '';
      _updateInitial();
    }
    nameC.addListener(_updateInitial);
  }

  void _updateInitial() {
    nameInitial.value = nameC.text.isNotEmpty
        ? nameC.text[0].toUpperCase()
        : 'P';
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    isLoading.value = true;
    try {
      final data = <String, dynamic>{
        'name': nameC.text.trim(),
        'city': cityC.text.trim(),
        'state': stateC.text.trim(),
      };
      final phone = contactC.text.trim();
      final email = emailC.text.trim();
      final address = addressC.text.trim();
      final gstin = gstinC.text.trim();
      if (phone.isNotEmpty) data['phone'] = phone;
      if (email.isNotEmpty) data['email'] = email;
      if (address.isNotEmpty) data['address'] = address;
      if (gstin.isNotEmpty) data['gstin'] = gstin;
      if (isEdit) {
        await _api.updateParty(editParty!.id, data);
        AppSnackbar.success('Party updated');
      } else {
        await _api.createParty(data);
        AppSnackbar.success('Party created');
      }
      Get.back(result: true);
      return;
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
    isLoading.value = false;
  }

  @override
  void onClose() {
    nameC.dispose();
    contactC.dispose();
    emailC.dispose();
    addressC.dispose();
    cityC.dispose();
    stateC.dispose();
    gstinC.dispose();
    super.onClose();
  }
}
