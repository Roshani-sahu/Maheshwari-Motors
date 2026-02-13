import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/challan/challan_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/challan_card.dart';

class ChallanListScreen extends StatelessWidget {
  const ChallanListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(ChallanListController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
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
          const SizedBox(height: 4),
          Obx(
            () => AppFilterChips(
              options: const ['all', 'GST', 'NON_GST'],
              selected: controller.typeFilter.value,
              onSelected: (v) => controller.typeFilter.value = v,
            ),
          ),
          const SizedBox(height: 4),
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
                    return ChallanCard(
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
