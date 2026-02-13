import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/bill/bill_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/bill_card.dart';

class BillListScreen extends StatelessWidget {
  const BillListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(BillListController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('Bills'),
        actions: [
          AppBarAddButton(
            onPressed: () async {
              final result = await Get.toNamed(AppRoutes.generateBill);
              if (result == true) controller.loadBills();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          AppSearchBar(
            hint: 'Search by bill no or party…',
            onChanged: (v) => controller.searchQuery.value = v,
          ),
          Obx(
            () => AppFilterChips(
              options: const ['all', 'paid', 'partial', 'due'],
              selected: controller.statusFilter.value,
              onSelected: (v) => controller.statusFilter.value = v,
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
                  onRetry: controller.loadBills,
                );
              }
              if (controller.filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.description_outlined,
                  title: 'No bills found',
                  subtitle: 'Bills will appear here',
                );
              }
              return RefreshIndicator(
                onRefresh: controller.loadBills,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: controller.filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final bill = controller.filtered[i];
                    return BillCard(
                      bill: bill,
                      onRecordPayment: bill.paymentStatus == 'paid'
                          ? null
                          : () async {
                              final result = await RecordPaymentSheet.show(
                                context: context,
                                referenceId: bill.id,
                                referenceLabel: 'Bill #${bill.billNo}',
                                totalAmount: bill.amount,
                                paidAmount: bill.paidAmount,
                                isSale: true,
                              );
                              if (result == true) controller.loadBills();
                            },
                      onDelete: () => DeleteConfirmSheet.show(
                        context: context,
                        title: 'Delete Bill #${bill.billNo}?',
                        subtitle: 'This action cannot be undone.',
                        onConfirm: () => controller.deleteBill(bill.id),
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
