import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../controllers/auth_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../data/models/bill_model.dart';
import '../../../data/services/api_service.dart';

class BillListController extends GetxController {
  final ApiService _api = ApiService();
  final AuthController _auth = Get.find<AuthController>();

  final RxList<BillModel> bills = <BillModel>[].obs;
  final RxList<BillModel> filtered = <BillModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString statusFilter = 'all'.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadBills();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
    ever(statusFilter, (_) => _filter());
  }

  Future<void> loadBills() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final firmId = _auth.firmId;
      if (firmId.isNotEmpty) {
        bills.value = await _api.getBills(firmId);
        _filter();
      }
    } catch (e) {
      errorMessage.value = 'Failed to load bills';
    }
    isLoading.value = false;
  }

  void _filter() {
    var list = bills.toList();
    if (searchQuery.value.isNotEmpty) {
      final q = searchQuery.value.toLowerCase();
      list = list
          .where(
            (b) =>
                b.billNo.toLowerCase().contains(q) ||
                (b.partyName?.toLowerCase().contains(q) ?? false),
          )
          .toList();
    }
    if (statusFilter.value != 'all') {
      list = list
          .where(
            (b) =>
                b.paymentStatus.toLowerCase() ==
                statusFilter.value.toLowerCase(),
          )
          .toList();
    }
    filtered.value = list;
  }

  Future<void> deleteBill(String id) async {
    try {
      await _api.deleteBill(_auth.firmId, id);
      bills.removeWhere((b) => b.id == id);
      _filter();
      AppSnackbar.success('Bill deleted');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}

class BillListScreen extends StatelessWidget {
  const BillListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(BillListController());
    final currencyFormat = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );
    final dateFormat = DateFormat('dd/MM/yyyy');

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Bill List')),
      body: Column(
        children: [
          // Search + Filter Chips
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 6),
            child: TextField(
              onChanged: (v) => controller.searchQuery.value = v,
              decoration: InputDecoration(
                hintText: 'Search by bill no or party...',
                prefixIcon: const Icon(Icons.search, size: 20),
                filled: true,
                fillColor: AppColors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppColors.border),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          SizedBox(
            height: 42,
            child: Obx(() {
              return ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: ['all', 'paid', 'partial', 'due']
                    .map(
                      (s) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(s.capitalizeFirst!),
                          selected: controller.statusFilter.value == s,
                          onSelected: (_) => controller.statusFilter.value = s,
                          selectedColor: AppColors.accentLight,
                          labelStyle: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: controller.statusFilter.value == s
                                ? AppColors.accent
                                : AppColors.textSecondary,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          side: BorderSide(
                            color: controller.statusFilter.value == s
                                ? AppColors.accent
                                : AppColors.border,
                          ),
                          backgroundColor: AppColors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 6),
                        ),
                      ),
                    )
                    .toList(),
              );
            }),
          ),
          const SizedBox(height: 8),

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
                );
              }
              return RefreshIndicator(
                onRefresh: controller.loadBills,
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                  itemCount: controller.filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final bill = controller.filtered[index];
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border, width: 0.5),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.accentLight,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  bill.billNo,
                                  style: Theme.of(context).textTheme.titleSmall
                                      ?.copyWith(
                                        color: AppColors.accent,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13,
                                      ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  bill.partyName ?? '-',
                                  style: Theme.of(context).textTheme.titleSmall
                                      ?.copyWith(fontWeight: FontWeight.w600),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Icon(
                                Icons.calendar_today_outlined,
                                size: 13,
                                color: AppColors.textSecondary,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                dateFormat.format(bill.date),
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              const Spacer(),
                              Text(
                                currencyFormat.format(bill.amount),
                                style: Theme.of(context).textTheme.titleSmall
                                    ?.copyWith(fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                          const Divider(height: 20),
                          Row(
                            children: [
                              Text(
                                'Paid: ${currencyFormat.format(bill.paidAmount)}',
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(color: AppColors.success),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'Due: ${currencyFormat.format(bill.balanceAmount)}',
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(
                                      color: bill.balanceAmount > 0
                                          ? AppColors.error
                                          : AppColors.textSecondary,
                                    ),
                              ),
                              const Spacer(),
                              StatusBadge.payment(bill.paymentStatus),
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: () =>
                                    _confirmDelete(context, controller, bill),
                                child: Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: AppColors.errorLight,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Icon(
                                    Icons.delete_outline,
                                    color: AppColors.error,
                                    size: 16,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
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

  void _confirmDelete(
    BuildContext context,
    BillListController controller,
    BillModel bill,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            const Icon(Icons.delete_outline, color: AppColors.error, size: 36),
            const SizedBox(height: 16),
            Text(
              'Delete ${bill.billNo}?',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    text: 'Cancel',
                    isOutlined: true,
                    onPressed: () => Get.back(),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: AppButton(
                    text: 'Delete',
                    color: AppColors.error,
                    onPressed: () {
                      Get.back();
                      controller.deleteBill(bill.id);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
