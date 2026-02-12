import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../routes/app_routes.dart';
import '../shared/widgets/common_widgets.dart';
import 'auth_controller.dart';

class LoginController extends GetxController {
  final formKey = GlobalKey<FormState>();
  final usernameController = TextEditingController();
  final passwordController = TextEditingController();
  final RxBool obscurePassword = true.obs;

  final RxString loginMode = 'firm'.obs;

  final AuthController _auth = Get.find<AuthController>();

  RxBool get isLoading => _auth.isLoading;

  bool get isAdminMode => loginMode.value == 'admin';

  void togglePasswordVisibility() => obscurePassword.toggle();

  void setLoginMode(String mode) {
    loginMode.value = mode;
    usernameController.clear();
    passwordController.clear();
  }

  Future<void> login() async {
    if (!formKey.currentState!.validate()) return;
    try {
      final username = usernameController.text.trim();
      final password = passwordController.text;
      bool success;
      if (isAdminMode) {
        success = await _auth.loginAdmin(username, password);
      } else {
        success = await _auth.loginFirm(username, password);
      }
      if (success) {
        Get.offAllNamed(AppRoutes.home);
      }
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }

  @override
  void onClose() {
    usernameController.dispose();
    passwordController.dispose();
    super.onClose();
  }
}
