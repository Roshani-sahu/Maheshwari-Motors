import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/party/party_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../routes/app_routes.dart';
import 'widgets/party_card.dart';

class PartyMasterScreen extends StatelessWidget {
  const PartyMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(PartyMasterController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
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
                    return PartyCard(
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
