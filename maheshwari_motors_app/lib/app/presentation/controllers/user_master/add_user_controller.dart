import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/user_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';

class AddUserController extends GetxController {
  final formKey = GlobalKey<FormState>();
  final usernameCtrl = TextEditingController();
  final emailCtrl = TextEditingController();
  final passwordCtrl = TextEditingController();

  final ApiService _api = Get.find<ApiService>();
  final RxBool isLoading = false.obs;
  final RxBool obscurePassword = true.obs;

  UserModel? editUser;
  bool get isEdit => editUser != null;

  @override
  void onInit() {
    super.onInit();
    editUser = Get.arguments as UserModel?;
    if (editUser != null) {
      usernameCtrl.text = editUser!.name;
      emailCtrl.text = editUser!.email ?? '';
    }
  }

  void togglePasswordVisibility() => obscurePassword.toggle();

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    isLoading.value = true;

    try {
      final data = <String, dynamic>{
        'username': usernameCtrl.text.trim(),
        'email': emailCtrl.text.trim(),
      };
      if (isEdit) {
        if (passwordCtrl.text.isNotEmpty) {
          data['password'] = passwordCtrl.text;
        }
        await _api.updateUser(editUser!.id, data);
        AppSnackbar.success('User updated');
      } else {
        data['password'] = passwordCtrl.text;
        data['type'] = 'secondary';
        await _api.createUser(data);
        AppSnackbar.success('User created');
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
    usernameCtrl.dispose();
    emailCtrl.dispose();
    passwordCtrl.dispose();
    super.onClose();
  }
}
