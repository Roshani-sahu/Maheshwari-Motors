import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/network/api_client.dart';
import '../../shared/widgets/common_widgets.dart';
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
      final username = usernameController.text.trim();
      final password = passwordController.text;
      final success = await _auth.login(username, password);
      if (success) {
        _auth.navigateByRole();
      }
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}
