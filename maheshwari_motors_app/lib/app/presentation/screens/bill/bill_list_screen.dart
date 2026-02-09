import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/bill_model.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/bill_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class BillListScreen extends StatelessWidget {
  const BillListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(BillListController());

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
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
                    return _BillCard(
                      bill: bill,
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

class _BillCard extends StatelessWidget {
  final BillModel bill;
  final VoidCallback? onDelete;
  const _BillCard({required this.bill, this.onDelete});

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
                  '#${bill.billNo}',
                  style: const TextStyle(
                    color: AppColors.accent,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
              const Spacer(),
              StatusBadge.payment(bill.paymentStatus),
              const SizedBox(width: 4),
              AppPopupMenu(onDelete: onDelete),
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
                  bill.partyName ?? 'N/A',
                  style: Theme.of(context).textTheme.bodyMedium,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const Icon(
                Icons.calendar_today,
                size: 14,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Text(
                AppFormatters.dateShort(bill.date),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Paid: ${AppFormatters.currency(bill.paidAmount)}',
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: AppColors.success),
                  ),
                  Text(
                    'Balance: ${AppFormatters.currency(bill.balanceAmount)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: bill.balanceAmount > 0
                          ? AppColors.error
                          : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              Text(
                AppFormatters.currency(bill.amount),
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
