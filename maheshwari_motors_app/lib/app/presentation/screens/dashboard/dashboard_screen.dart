import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../controllers/auth_controller.dart';
import '../../controllers/dashboard_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(DashboardController());
    final auth = Get.find<AuthController>();

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        leading: const AppDrawerButton(),
        title: Obx(
          () => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Dashboard'),
              if (auth.firmData != null)
                Text(
                  auth.firmData!.name,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(fontSize: 12),
                ),
            ],
          ),
        ),
        actions: [
          if (auth.isFirmLogin)
            Obx(
              () => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: StatusBadge.gst(auth.firmData?.firmType ?? ''),
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
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Obx(
                  () => Row(
                    children: DashboardController.periodOptions.map((period) {
                      final isSelected =
                          controller.selectedPeriod.value == period;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(DashboardController.periodLabel(period)),
                          selected: isSelected,
                          selectedColor: AppColors.accent,
                          labelStyle: TextStyle(
                            color: isSelected
                                ? AppColors.white
                                : AppColors.textPrimary,
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                          onSelected: (_) => controller.changePeriod(period),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Challans',
                      value: '${controller.totalChallans}',
                      icon: Icons.receipt_long,
                      color: AppColors.accent,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: 'Bills',
                      value: '${controller.totalBills}',
                      icon: Icons.description,
                      color: Colors.deepPurple,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Revenue',
                      value: AppFormatters.currency(controller.totalRevenue),
                      icon: Icons.currency_rupee_rounded,
                      color: AppColors.success,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: 'Pending',
                      value: AppFormatters.currency(controller.pendingAmount),
                      icon: Icons.pending_actions_rounded,
                      color: AppColors.warning,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Transactions',
                      value: '${controller.totalTransactions}',
                      icon: Icons.swap_horiz,
                      color: AppColors.info,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: 'Purchases',
                      value: AppFormatters.currency(controller.purchaseAmount),
                      icon: Icons.shopping_cart_outlined,
                      color: Colors.teal,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              _MonthlyRevenueChart(controller: controller),
              const SizedBox(height: 20),
            ],
          ),
        );
      }),
    );
  }
}

class _MonthlyRevenueChart extends StatelessWidget {
  final DashboardController controller;
  const _MonthlyRevenueChart({required this.controller});

  @override
  Widget build(BuildContext context) {
    final data = controller.monthlyRevenue;
    if (data.isEmpty) return const SizedBox.shrink();

    final last6 = data.length > 6 ? data.sublist(data.length - 6) : data;

    double maxY = 0;
    for (final d in last6) {
      final total = (d['total'] as num?)?.toDouble() ?? 0;
      if (total > maxY) maxY = total;
    }
    maxY = (maxY * 1.3).ceilToDouble();
    if (maxY < 1000) maxY = 1000;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Monthly Revenue',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: maxY,
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipItem: (group, groupIdx, rod, rodIdx) {
                      final d = last6[groupIdx];
                      final count = d['count'] ?? 0;
                      return BarTooltipItem(
                        '₹${rod.toY.toInt()} ($count bills)',
                        const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 48,
                      getTitlesWidget: (value, meta) {
                        if (value == meta.max || value == meta.min) {
                          return const SizedBox.shrink();
                        }
                        final k = value / 1000;
                        return Text(
                          '${k.toStringAsFixed(k.truncateToDouble() == k ? 0 : 1)}k',
                          style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.textSecondary,
                          ),
                        );
                      },
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, _) {
                        final idx = value.toInt();
                        if (idx < 0 || idx >= last6.length) {
                          return const SizedBox.shrink();
                        }
                        final month = (last6[idx]['_id'] as num?)?.toInt() ?? 0;
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            _shortMonth(month),
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxY / 4,
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: AppColors.border,
                    strokeWidth: 0.5,
                    dashArray: [4, 4],
                  ),
                ),
                barGroups: List.generate(last6.length, (i) {
                  final total = (last6[i]['total'] as num?)?.toDouble() ?? 0;
                  return BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: total,
                        color: AppColors.accent,
                        width: 16,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(4),
                        ),
                      ),
                    ],
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _shortMonth(int month) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    if (month >= 1 && month <= 12) return months[month - 1];
    return '$month';
  }
}
