import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/firm_model.dart';
import '../../controllers/firm_selection_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class FirmSelectionScreen extends StatelessWidget {
  const FirmSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(FirmSelectionController());

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.accentLight,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.business,
                      color: AppColors.accent,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Select Firm',
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                        ),
                        Text(
                          'Choose a firm to continue',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: controller.auth.logout,
                    icon: const Icon(Icons.logout, color: AppColors.error),
                    tooltip: 'Logout',
                  ),
                ],
              ),
              const SizedBox(height: 28),
              Expanded(
                child: Obx(() {
                  if (controller.isLoading.value) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (controller.error.isNotEmpty) {
                    return ErrorState(
                      message: controller.error.value,
                      onRetry: controller.loadFirms,
                    );
                  }
                  if (controller.firms.isEmpty) {
                    return const EmptyState(
                      icon: Icons.business_outlined,
                      title: 'No firms available',
                      subtitle: 'Contact admin to add you to a firm',
                    );
                  }
                  return ListView.separated(
                    itemCount: controller.firms.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (_, i) => _FirmTile(
                      firm: controller.firms[i],
                      onTap: () =>
                          controller.auth.selectFirm(controller.firms[i]),
                    ),
                  );
                }),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FirmTile extends StatelessWidget {
  final FirmModel firm;
  final VoidCallback onTap;
  const _FirmTile({required this.firm, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(18),
      onTap: onTap,
      child: Row(
        children: [
          InitialsAvatar(name: firm.name, radius: 26, fontSize: 22),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  firm.name,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${firm.city}, ${firm.state}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          StatusBadge(
            label: firm.type,
            color: firm.isGST ? AppColors.successLight : AppColors.infoLight,
            textColor: firm.isGST ? AppColors.success : AppColors.info,
          ),
          const SizedBox(width: 8),
          Icon(
            Icons.arrow_forward_ios,
            size: 16,
            color: AppColors.textSecondary.withValues(alpha: 0.5),
          ),
        ],
      ),
    );
  }
}
