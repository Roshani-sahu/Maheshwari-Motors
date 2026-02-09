import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../controllers/home_controller.dart';
import '../../controllers/party_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../data/models/party_model.dart';
import '../../../routes/app_routes.dart';

class PartyMasterScreen extends StatelessWidget {
  const PartyMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(PartyMasterController());

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: Get.isRegistered<HomeController>()
            ? IconButton(
                icon: const Icon(Icons.menu_rounded),
                onPressed: Get.find<HomeController>().openDrawer,
              )
            : null,
        title: const Text('Party Master'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Get.toNamed(AppRoutes.addParty);
          if (result == true) controller.loadParties();
        },
        backgroundColor: AppColors.accent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        child: const Icon(Icons.add, color: AppColors.white),
      ),
      body: Column(
        children: [
          AppSearchBar(
            hint: 'Search party by name or contact...',
            onChanged: (v) => controller.searchQuery.value = v,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          ),
          Obx(
            () => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  Text(
                    '${controller.filtered.length} parties',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }
              if (controller.errorMessage.isNotEmpty) {
                return ErrorState(
                  message: controller.errorMessage.value,
                  onRetry: controller.loadParties,
                );
              }
              if (controller.filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.people_alt_outlined,
                  title: 'No parties found',
                  subtitle: 'Add a new party to get started',
                );
              }
              return RefreshIndicator(
                onRefresh: controller.loadParties,
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                  itemCount: controller.filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final party = controller.filtered[index];
                    return _PartyCard(
                      party: party,
                      onEdit: () async {
                        final result = await Get.toNamed(
                          AppRoutes.editParty,
                          arguments: party,
                        );
                        if (result == true) controller.loadParties();
                      },
                      onDelete: () => DeleteConfirmSheet.show(
                        context: context,
                        title: 'Delete ${party.name}?',
                        subtitle: 'This action cannot be undone',
                        onConfirm: () => controller.deleteParty(party.id),
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

class _PartyCard extends StatelessWidget {
  final PartyModel party;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _PartyCard({
    required this.party,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          InitialsAvatar(name: party.name, radius: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  party.name,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                if (party.phone != null && party.phone!.isNotEmpty)
                  Text(
                    party.phone!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                AppFormatters.currency(party.balance),
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: party.balance > 0
                      ? AppColors.error
                      : party.balance < 0
                      ? AppColors.success
                      : AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ActionIcon(
                    icon: Icons.edit_outlined,
                    color: AppColors.accent,
                    onTap: onEdit,
                  ),
                  const SizedBox(width: 6),
                  ActionIcon(
                    icon: Icons.delete_outline,
                    color: AppColors.error,
                    onTap: onDelete,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
