import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/auth_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../data/services/api_service.dart';

class DashboardController extends GetxController {
  final ApiService _api = ApiService();
  final AuthController _auth = Get.find<AuthController>();

  final RxBool isLoading = true.obs;
  final RxMap<String, dynamic> dashboardData = <String, dynamic>{}.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadDashboard();
  }

  Future<void> loadDashboard() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final firmId = _auth.firmId;
      if (firmId.isNotEmpty) {
        final data = await _api.getFirmDashboard(firmId);
        dashboardData.value = data;
      }
    } catch (e) {
      errorMessage.value = 'Failed to load dashboard';
    }
    isLoading.value = false;
  }

  // Nested keys from backend: data.challans.{total, today, this_month, total_amount}
  int get totalChallans => (dashboardData['challans'] as Map?)?['total'] ?? 0;
  int get todayChallans => (dashboardData['challans'] as Map?)?['today'] ?? 0;
  double get challanAmount =>
      ((dashboardData['challans'] as Map?)?['total_amount'] ?? 0).toDouble();

  // Nested keys from backend: data.bills.{total, today, due, paid, total_amount, total_paid}
  int get totalBills => (dashboardData['bills'] as Map?)?['total'] ?? 0;
  int get dueBills => (dashboardData['bills'] as Map?)?['due'] ?? 0;
  double get totalRevenue =>
      ((dashboardData['bills'] as Map?)?['total_amount'] ?? 0).toDouble();
  double get totalPaid =>
      ((dashboardData['bills'] as Map?)?['total_paid'] ?? 0).toDouble();

  List get recentChallans => dashboardData['recent_challans'] ?? [];
  List get recentBills => dashboardData['recent_bills'] ?? [];
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(DashboardController());
    final auth = Get.find<AuthController>();
    final currencyFormat = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu_rounded),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
        title: Obx(
          () => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Dashboard'),
              Text(
                auth.selectedFirm.value?.name ?? '',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(fontSize: 12),
              ),
            ],
          ),
        ),
        actions: [
          Obx(
            () => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: StatusBadge.gst(auth.selectedFirm.value?.type ?? ''),
            ),
          ),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }
        if (controller.errorMessage.isNotEmpty) {
          return ErrorState(
            message: controller.errorMessage.value,
            onRetry: controller.loadDashboard,
          );
        }
        return RefreshIndicator(
          onRefresh: controller.loadDashboard,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Welcome section
              Text(
                'Welcome back!',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 4),
              Text(
                "Here's your business overview",
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 20),

              // Stats grid
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Total Challans',
                      value: '${controller.totalChallans}',
                      icon: Icons.receipt_long,
                      color: AppColors.accent,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: "Today's Challans",
                      value: '${controller.todayChallans}',
                      icon: Icons.today_rounded,
                      color: AppColors.success,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Total Bills',
                      value: '${controller.totalBills}',
                      icon: Icons.description,
                      color: AppColors.error,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: 'Due Bills',
                      value: '${controller.dueBills}',
                      icon: Icons.pending_actions_rounded,
                      color: AppColors.warning,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Revenue card
              StatCard(
                title: 'Total Revenue',
                value: currencyFormat.format(controller.totalRevenue),
                icon: Icons.currency_rupee_rounded,
                color: AppColors.success,
              ),
              const SizedBox(height: 24),

              // Recent Challans
              _SectionHeader(title: 'Recent Challans'),
              const SizedBox(height: 12),
              if (controller.recentChallans.isEmpty)
                _EmptySection(text: 'No challans yet')
              else
                ...controller.recentChallans
                    .take(5)
                    .map(
                      (ch) => _RecentCard(
                        number: ch['challan_no'] ?? '',
                        partyName: ch['party_id'] is Map
                            ? ch['party_id']['name'] ?? ''
                            : '',
                        amount: currencyFormat.format(
                          (ch['amount'] ?? 0).toDouble(),
                        ),
                        date: _formatDate(ch['date']),
                        color: AppColors.accent,
                      ),
                    ),

              const SizedBox(height: 24),

              // Recent Bills
              _SectionHeader(title: 'Recent Bills'),
              const SizedBox(height: 12),
              if (controller.recentBills.isEmpty)
                _EmptySection(text: 'No bills yet')
              else
                ...controller.recentBills
                    .take(5)
                    .map(
                      (bl) => _RecentCard(
                        number: bl['bill_no'] ?? '',
                        partyName: bl['party_id'] is Map
                            ? bl['party_id']['name'] ?? ''
                            : '',
                        amount: currencyFormat.format(
                          (bl['amount'] ?? 0).toDouble(),
                        ),
                        date: _formatDate(bl['date']),
                        color: AppColors.success,
                      ),
                    ),

              const SizedBox(height: 20),
            ],
          ),
        );
      }),
    );
  }

  static String _formatDate(dynamic date) {
    if (date == null) return '';
    try {
      final d = DateTime.parse(date.toString());
      return DateFormat('dd/MM/yyyy').format(d);
    } catch (_) {
      return date.toString();
    }
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(title, style: Theme.of(context).textTheme.titleMedium);
  }
}

class _EmptySection extends StatelessWidget {
  final String text;

  const _EmptySection({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Center(
        child: Text(text, style: Theme.of(context).textTheme.bodyMedium),
      ),
    );
  }
}

class _RecentCard extends StatelessWidget {
  final String number;
  final String partyName;
  final String amount;
  final String date;
  final Color color;

  const _RecentCard({
    required this.number,
    required this.partyName,
    required this.amount,
    required this.date,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 36,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      number,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        partyName,
                        style: Theme.of(context).textTheme.bodyMedium,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  date,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(fontSize: 11),
                ),
              ],
            ),
          ),
          Text(
            amount,
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}
