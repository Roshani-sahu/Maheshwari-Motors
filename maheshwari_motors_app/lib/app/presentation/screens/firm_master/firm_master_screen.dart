import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/firm_model.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/firm_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class FirmMasterScreen extends StatelessWidget {
  const FirmMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(FirmMasterController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('Firm Master'),
        actions: [
          AppBarAddButton(
            onPressed: () async {
              final result = await Get.toNamed(AppRoutes.addFirm);
              if (result == true) controller.loadFirms();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          AppSearchBar(
            hint: 'Search firms…',
            onChanged: (v) => controller.searchQuery.value = v,
          ),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }
              if (controller.errorMessage.isNotEmpty) {
                return ErrorState(
                  message: controller.errorMessage.value,
                  onRetry: controller.loadFirms,
                );
              }
              if (controller.filteredFirms.isEmpty) {
                return const EmptyState(
                  icon: Icons.business_outlined,
                  title: 'No firms found',
                  subtitle: 'Add a firm to get started',
                );
              }
              return RefreshIndicator(
                onRefresh: controller.loadFirms,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: controller.filteredFirms.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final firm = controller.filteredFirms[i];
                    return _FirmCard(
                      firm: firm,
                      onEdit: () async {
                        final result = await Get.toNamed(
                          AppRoutes.editFirm,
                          arguments: firm,
                        );
                        if (result == true) controller.loadFirms();
                      },
                      onDelete: () => DeleteConfirmSheet.show(
                        context: context,
                        title: 'Delete "${firm.name}"?',
                        subtitle:
                            'This will permanently delete this firm and all associated data.',
                        onConfirm: () => controller.deleteFirm(firm.id),
                      ),
                    );
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class _FirmCard extends StatelessWidget {
  final FirmModel firm;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _FirmCard({
    required this.firm,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          InitialsAvatar(name: firm.name),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  firm.name,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 3),
                Text(
                  '${firm.city}, ${firm.state}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          StatusBadge(
            label: firm.type,
            color: firm.isGST ? AppColors.successLight : AppColors.infoLight,
            textColor: firm.isGST ? AppColors.success : AppColors.info,
          ),
          AppPopupMenu(onEdit: onEdit, onDelete: onDelete),
        ],
      ),
    );
  }
}
