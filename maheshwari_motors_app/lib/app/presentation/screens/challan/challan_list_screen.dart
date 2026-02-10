import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/challan_model.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/home_controller.dart';
import '../../controllers/challan_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class ChallanListScreen extends StatelessWidget {
  const ChallanListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(ChallanListController());

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: Get.isRegistered<HomeController>()
            ? IconButton(
                icon: const Icon(Icons.menu_rounded),
                onPressed: Get.find<HomeController>().openDrawer,
              )
            : null,
        title: const Text('Challans'),
        actions: [
          AppBarAddButton(
            onPressed: () async {
              final result = await Get.toNamed(AppRoutes.createChallan);
              if (result == true) controller.loadChallans();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          AppSearchBar(
            hint: 'Search by challan no or party…',
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
                  onRetry: controller.loadChallans,
                );
              }
              if (controller.filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.receipt_long_outlined,
                  title: 'No challans found',
                  subtitle: 'Tap + to create a new challan',
                );
              }
              return RefreshIndicator(
                onRefresh: controller.loadChallans,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: controller.filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final challan = controller.filtered[i];
                    return _ChallanCard(
                      challan: challan,
                      onEdit: challan.convertedToBill
                          ? null
                          : () async {
                              final result = await Get.toNamed(
                                AppRoutes.editChallan,
                                arguments: challan,
                              );
                              if (result == true) controller.loadChallans();
                            },
                      onDelete: challan.convertedToBill
                          ? null
                          : () => DeleteConfirmSheet.show(
                              context: context,
                              title: 'Delete Challan #${challan.challanNo}?',
                              subtitle: 'This action cannot be undone.',
                              onConfirm: () =>
                                  controller.deleteChallan(challan.id),
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

class _ChallanCard extends StatelessWidget {
  final ChallanModel challan;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  const _ChallanCard({required this.challan, this.onEdit, this.onDelete});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.accentLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '#${challan.challanNo}',
                  style: const TextStyle(
                    color: AppColors.accent,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
              const Spacer(),
              if (challan.convertedToBill)
                const StatusBadge(
                  label: 'BILLED',
                  color: AppColors.successLight,
                  textColor: AppColors.success,
                )
              else
                const StatusBadge(
                  label: 'OPEN',
                  color: AppColors.warningLight,
                  textColor: AppColors.warning,
                ),
              const SizedBox(width: 4),
              AppPopupMenu(onEdit: onEdit, onDelete: onDelete),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(
                Icons.person_outline,
                size: 16,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  challan.partyName ?? 'N/A',
                  style: Theme.of(context).textTheme.bodyMedium,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                Icons.calendar_today,
                size: 14,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Text(
                AppFormatters.dateShort(challan.date),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                '${challan.items.length} items',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const Spacer(),
              Text(
                AppFormatters.currency(challan.amount),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.accent,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
