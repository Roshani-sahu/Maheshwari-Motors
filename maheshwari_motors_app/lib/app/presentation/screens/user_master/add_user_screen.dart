import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/validators.dart';
import '../../controllers/add_user_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class AddUserScreen extends StatelessWidget {
  const AddUserScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<AddUserController>();

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(title: Text(controller.isEdit ? 'Edit User' : 'Add User')),
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
                  Icons.person_outline,
                  size: 36,
                  color: AppColors.accent,
                ),
              ),
              const SizedBox(height: 28),

              // Required fields note
              Text(
                'Fields marked with * are required',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                  fontStyle: FontStyle.italic,
                ),
              ),
              const SizedBox(height: 16),

              AppTextField(
                label: 'Username *',
                hint: 'Enter username',
                controller: controller.usernameCtrl,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),

              AppTextField(
                label: 'Email *',
                hint: 'Enter email',
                controller: controller.emailCtrl,
                keyboardType: TextInputType.emailAddress,
                validator: AppValidators.requiredEmail,
              ),
              const SizedBox(height: 16),

              Obx(
                () => AppTextField(
                  label: controller.isEdit
                      ? 'New Password (optional)'
                      : 'Password *',
                  hint: 'Enter password',
                  controller: controller.passwordCtrl,
                  obscureText: controller.obscurePassword.value,
                  suffixIcon: GestureDetector(
                    onTap: controller.togglePasswordVisibility,
                    child: Icon(
                      controller.obscurePassword.value
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      size: 20,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  validator: controller.isEdit
                      ? AppValidators.optionalPassword
                      : AppValidators.password,
                ),
              ),
              const SizedBox(height: 32),

              Obx(
                () => AppButton(
                  text: controller.isEdit ? 'Update User' : 'Create User',
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
