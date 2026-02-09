import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/validators.dart';
import '../../controllers/change_password_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class ChangePasswordScreen extends StatelessWidget {
  const ChangePasswordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<ChangePasswordController>();

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(title: const Text('Change Password')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: controller.formKey,
          child: Column(
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: AppColors.accentLight,
                child: Icon(
                  Icons.lock_outline,
                  size: 36,
                  color: AppColors.accent,
                ),
              ),
              const SizedBox(height: 28),

              Obx(
                () => AppTextField(
                  label: 'Current Password',
                  hint: 'Enter current password',
                  controller: controller.currentPasswordCtrl,
                  obscureText: controller.obscureCurrent.value,
                  suffixIcon: GestureDetector(
                    onTap: controller.toggleCurrent,
                    child: Icon(
                      controller.obscureCurrent.value
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      size: 20,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  validator: AppValidators.password,
                ),
              ),
              const SizedBox(height: 16),

              Obx(
                () => AppTextField(
                  label: 'New Password',
                  hint: 'Enter new password',
                  controller: controller.newPasswordCtrl,
                  obscureText: controller.obscureNew.value,
                  suffixIcon: GestureDetector(
                    onTap: controller.toggleNew,
                    child: Icon(
                      controller.obscureNew.value
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      size: 20,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  validator: AppValidators.password,
                ),
              ),
              const SizedBox(height: 16),

              Obx(
                () => AppTextField(
                  label: 'Confirm Password',
                  hint: 'Re-enter new password',
                  controller: controller.confirmPasswordCtrl,
                  obscureText: controller.obscureConfirm.value,
                  suffixIcon: GestureDetector(
                    onTap: controller.toggleConfirm,
                    child: Icon(
                      controller.obscureConfirm.value
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      size: 20,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  validator: controller.validateConfirm,
                ),
              ),
              const SizedBox(height: 32),

              Obx(
                () => AppButton(
                  text: 'Change Password',
                  isLoading: controller.isLoading.value,
                  onPressed: controller.submit,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
