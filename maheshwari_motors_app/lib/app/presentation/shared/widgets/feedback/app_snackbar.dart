import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_theme.dart';

class AppSnackbar {
  AppSnackbar._();

  static void success(String message) {
    Get.closeAllSnackbars();
    Get.rawSnackbar(
      message: message,
      backgroundColor: AppColors.success,
      borderRadius: 12,
      margin: const EdgeInsets.all(16),
      snackPosition: SnackPosition.TOP,
      duration: const Duration(seconds: 2),
      icon: const Icon(Icons.check_circle, color: AppColors.white),
    );
  }

  static void error(String message) {
    Get.closeAllSnackbars();
    Get.rawSnackbar(
      message: message,
      backgroundColor: AppColors.error,
      borderRadius: 12,
      margin: const EdgeInsets.all(16),
      snackPosition: SnackPosition.TOP,
      duration: const Duration(seconds: 3),
      icon: const Icon(Icons.error_outline, color: AppColors.white),
    );
  }
}
