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

  final AuthController _auth = Get.find<AuthController>();

  RxBool get isLoading => _auth.isLoading;

  void togglePasswordVisibility() => obscurePassword.toggle();

  Future<void> login() async {
    if (!formKey.currentState!.validate()) return;
    try {
      final success = await _auth.login(
        usernameController.text.trim(),
        passwordController.text,
      );
      if (success) {
        Get.offAllNamed(AppRoutes.firmSelection);
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
