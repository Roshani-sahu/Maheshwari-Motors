import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../controllers/login_controller.dart';
import '../../../shared/widgets/common_widgets.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(LoginController());

    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Form(
            key: controller.formKey,
            child: Column(
              children: [
                const SizedBox(height: 60),

                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.accent,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.accent.withValues(alpha: 0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.directions_car,
                    color: AppColors.white,
                    size: 40,
                  ),
                ),
                const SizedBox(height: 28),

                Text(
                  'Maheshwari Motors',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Sign in to your account',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 32),

                Obx(
                  () => Container(
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.all(4),
                    child: Row(
                      children: [
                        Expanded(
                          child: _ModeTab(
                            label: 'Firm Login',
                            isActive: !controller.isAdminMode,
                            onTap: () => controller.setLoginMode('firm'),
                          ),
                        ),
                        Expanded(
                          child: _ModeTab(
                            label: 'Admin Login',
                            isActive: controller.isAdminMode,
                            onTap: () => controller.setLoginMode('admin'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                AppTextField(
                  label: 'Username',
                  hint: 'Enter your username',
                  controller: controller.usernameController,
                  prefixIcon: const Icon(
                    Icons.person_outline,
                    size: 20,
                    color: AppColors.textSecondary,
                  ),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 20),

                Obx(
                  () => AppTextField(
                    label: 'Password',
                    hint: 'Enter your password',
                    controller: controller.passwordController,
                    obscureText: controller.obscurePassword.value,
                    prefixIcon: const Icon(
                      Icons.lock_outline,
                      size: 20,
                      color: AppColors.textSecondary,
                    ),
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
                    validator: (v) =>
                        v == null || v.isEmpty ? 'Required' : null,
                  ),
                ),
                const SizedBox(height: 36),

                Obx(
                  () => AppButton(
                    text: controller.isAdminMode
                        ? 'Sign In as Admin'
                        : 'Sign In to Firm',
                    isLoading: controller.isLoading.value,
                    onPressed: controller.login,
                  ),
                ),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ModeTab extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _ModeTab({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? AppColors.accent : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 13,
            color: isActive ? AppColors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
