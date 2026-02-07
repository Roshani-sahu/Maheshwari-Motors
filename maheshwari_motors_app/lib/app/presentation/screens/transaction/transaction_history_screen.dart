import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/auth_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../data/models/transaction_model.dart';
import '../../../data/services/api_service.dart';

class TransactionHistoryController extends GetxController {
  final ApiService _api = ApiService();
  final AuthController _auth = Get.find<AuthController>();

  final RxList<TransactionModel> transactions = <TransactionModel>[].obs;
  final RxList<TransactionModel> filtered = <TransactionModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString typeFilter = 'all'.obs;
  final RxMap<String, dynamic> summary = <String, dynamic>{}.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadData();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
    ever(typeFilter, (_) => _filter());
  }

  Future<void> loadData() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final firmId = _auth.firmId;
      if (firmId.isNotEmpty) {
        final results = await Future.wait([
          _api.getTransactions(firmId),
          _api.getTransactionSummary(firmId),
        ]);
        transactions.value = results[0] as List<TransactionModel>;
        summary.value = results[1] as Map<String, dynamic>;
        _filter();
      }
    } catch (e) {
      errorMessage.value = 'Failed to load transactions';
    }
    isLoading.value = false;
  }

  void _filter() {
    var list = transactions.toList();
    if (searchQuery.value.isNotEmpty) {
      final q = searchQuery.value.toLowerCase();
      list = list.where((t) {
        final party = t.partyName?.toLowerCase() ?? '';
        final type = t.type.toLowerCase();
        return party.contains(q) || type.contains(q);
      }).toList();
    }
    if (typeFilter.value != 'all') {
      list = list
          .where((t) => t.type.toLowerCase() == typeFilter.value.toLowerCase())
          .toList();
    }
    filtered.value = list;
  }
}

class TransactionHistoryScreen extends StatelessWidget {
  const TransactionHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.put(TransactionHistoryController());
    final currencyFormat = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );
    final dateFormat = DateFormat('dd MMM yyyy');

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Transaction History')),
      body: Obx(() {
        if (c.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }
        if (c.errorMessage.isNotEmpty) {
          return ErrorState(message: c.errorMessage.value, onRetry: c.loadData);
        }
        return RefreshIndicator(
          onRefresh: c.loadData,
          child: CustomScrollView(
            slivers: [
              // Summary Cards
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: StatCard(
                          title: 'Transactions',
                          value:
                              '${c.summary['total_transactions'] ?? c.transactions.length}',
                          icon: Icons.swap_horiz,
                          color: AppColors.accent,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: StatCard(
                          title: 'Sales',
                          value: currencyFormat.format(
                            (c.summary['total_sale_amount'] ?? 0).toDouble(),
                          ),
                          icon: Icons.trending_up,
                          color: AppColors.success,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Filter Chips
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 42,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: ['all', 'sale', 'purchase', 'payment', 'receipt']
                        .map(
                          (t) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(t.capitalizeFirst!),
                              selected: c.typeFilter.value == t,
                              onSelected: (_) => c.typeFilter.value = t,
                              selectedColor: AppColors.accentLight,
                              labelStyle: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: c.typeFilter.value == t
                                    ? AppColors.accent
                                    : AppColors.textSecondary,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              side: BorderSide(
                                color: c.typeFilter.value == t
                                    ? AppColors.accent
                                    : AppColors.border,
                              ),
                              backgroundColor: AppColors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
              ),

              // Search
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: TextField(
                    onChanged: (v) => c.searchQuery.value = v,
                    decoration: InputDecoration(
                      hintText: 'Search transactions...',
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
              ),

              // List
              if (c.filtered.isEmpty)
                const SliverFillRemaining(
                  child: EmptyState(
                    icon: Icons.swap_horiz,
                    title: 'No transactions found',
                  ),
                )
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final txn = c.filtered[index];
                    return _TransactionCard(
                      txn: txn,
                      currencyFormat: currencyFormat,
                      dateFormat: dateFormat,
                    );
                  }, childCount: c.filtered.length),
                ),
            ],
          ),
        );
      }),
    );
  }
}

class _TransactionCard extends StatelessWidget {
  final TransactionModel txn;
  final NumberFormat currencyFormat;
  final DateFormat dateFormat;

  const _TransactionCard({
    required this.txn,
    required this.currencyFormat,
    required this.dateFormat,
  });

  Color _typeColor() {
    switch (txn.type.toLowerCase()) {
      case 'sale':
        return AppColors.success;
      case 'purchase':
        return AppColors.warning;
      case 'payment':
        return AppColors.info;
      case 'receipt':
        return AppColors.accent;
      default:
        return AppColors.textSecondary;
    }
  }

  IconData _typeIcon() {
    switch (txn.type.toLowerCase()) {
      case 'sale':
        return Icons.trending_up;
      case 'purchase':
        return Icons.trending_down;
      case 'payment':
        return Icons.arrow_upward;
      case 'receipt':
        return Icons.arrow_downward;
      default:
        return Icons.swap_horiz;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _typeColor();
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(_typeIcon(), color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    StatusBadge(
                      label: txn.type.capitalizeFirst!,
                      color: color.withValues(alpha: 0.12),
                      textColor: color,
                    ),
                    const Spacer(),
                    Text(
                      currencyFormat.format(txn.amount),
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    if (txn.partyName != null) ...[
                      Flexible(
                        child: Text(
                          txn.partyName!,
                          style: Theme.of(context).textTheme.bodySmall,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Text(
                      dateFormat.format(txn.createdAt),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
