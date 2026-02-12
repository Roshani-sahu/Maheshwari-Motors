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
              // ── Firm Switcher Dropdown ──
              Obx(() {
                if (controller.firms.length <= 1) {
                  return const SizedBox.shrink();
                }
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: auth.firmId,
                      isExpanded: true,
                      icon: const Icon(
                        Icons.swap_horiz_rounded,
                        color: AppColors.accent,
                      ),
                      items: controller.firms
                          .map(
                            (f) => DropdownMenuItem(
                              value: f.id,
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.business_rounded,
                                    size: 18,
                                    color: f.id == auth.firmId
                                        ? AppColors.accent
                                        : AppColors.textSecondary,
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      f.name,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontWeight: f.id == auth.firmId
                                            ? FontWeight.w600
                                            : FontWeight.w400,
                                      ),
                                    ),
                                  ),
                                  StatusBadge.gst(f.type),
                                ],
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (id) {
                        if (id != null) controller.switchToFirm(id);
                      },
                    ),
                  ),
                );
              }),

              // ── Period filter chips ──
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

              // ── Stat cards (no Total Revenue) ──
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
                      title: 'Paid Bills',
                      value: '${controller.paidBills}',
                      icon: Icons.check_circle_outline,
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
                      color: Colors.deepPurple,
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
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Challan Amount',
                      value: AppFormatters.currency(controller.challanAmount),
                      icon: Icons.currency_rupee_rounded,
                      color: AppColors.success,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: 'Total Paid',
                      value: AppFormatters.currency(controller.totalPaid),
                      icon: Icons.account_balance_wallet,
                      color: AppColors.accent,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // ── Monthly Trend Chart ──
              _MonthlyChart(controller: controller),
              const SizedBox(height: 24),

              // ── Recent Challans ──
              _SectionHeader(title: 'Recent Challans'),
              const SizedBox(height: 12),
              if (controller.recentChallans.isEmpty)
                _EmptySection(text: 'No challans yet')
              else
                ...controller.recentChallans
                    .take(5)
                    .map(
                      (ch) => _RecentCard(
                        number: '#${ch.challanNo}',
                        partyName: ch.partyName ?? '',
                        amount: AppFormatters.currency(ch.amount),
                        date: AppFormatters.dateShort(ch.date),
                        color: AppColors.accent,
                      ),
                    ),
              const SizedBox(height: 24),

              // ── Recent Bills ──
              _SectionHeader(title: 'Recent Bills'),
              const SizedBox(height: 12),
              if (controller.recentBills.isEmpty)
                _EmptySection(text: 'No bills yet')
              else
                ...controller.recentBills
                    .take(5)
                    .map(
                      (bl) => _RecentCard(
                        number: '#${bl.billNo}',
                        partyName: bl.partyName ?? '',
                        amount: AppFormatters.currency(bl.amount),
                        date: AppFormatters.dateShort(bl.date),
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
}

// ── Monthly Trend Chart ─────────────────────────────────────────────

class _MonthlyChart extends StatelessWidget {
  final DashboardController controller;
  const _MonthlyChart({required this.controller});

  @override
  Widget build(BuildContext context) {
    final challansData = controller.challansByMonth;
    final billsData = controller.billsByMonth;

    if (challansData.isEmpty && billsData.isEmpty) {
      return const SizedBox.shrink();
    }

    // Merge months into a unified list
    final Set<String> allMonths = {};
    for (final d in challansData) {
      allMonths.add(d['_id'] as String);
    }
    for (final d in billsData) {
      allMonths.add(d['_id'] as String);
    }

    final sortedMonths = allMonths.toList()..sort();
    final last6 = sortedMonths.length > 6
        ? sortedMonths.sublist(sortedMonths.length - 6)
        : sortedMonths;

    final challanMap = {for (var d in challansData) d['_id'] as String: d};
    final billMap = {for (var d in billsData) d['_id'] as String: d};

    double maxY = 0;
    for (final m in last6) {
      final cc = (challanMap[m]?['count'] ?? 0) as num;
      final bc = (billMap[m]?['count'] ?? 0) as num;
      if (cc > maxY) maxY = cc.toDouble();
      if (bc > maxY) maxY = bc.toDouble();
    }
    maxY = (maxY * 1.3).ceilToDouble();
    if (maxY < 5) maxY = 5;

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
            'Monthly Trend',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _LegendDot(color: AppColors.accent, label: 'Challans'),
              const SizedBox(width: 16),
              _LegendDot(color: AppColors.success, label: 'Bills'),
            ],
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
                      final label = rodIdx == 0 ? 'Challans' : 'Bills';
                      return BarTooltipItem(
                        '$label: ${rod.toY.toInt()}',
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
                      reservedSize: 32,
                      getTitlesWidget: (value, meta) {
                        if (value == meta.max || value == meta.min) {
                          return const SizedBox.shrink();
                        }
                        return Text(
                          value.toInt().toString(),
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
                        final month = last6[idx];
                        final shortMonth = _shortMonthLabel(month);
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            shortMonth,
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
                  final m = last6[i];
                  final cc = (challanMap[m]?['count'] ?? 0) as num;
                  final bc = (billMap[m]?['count'] ?? 0) as num;
                  return BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: cc.toDouble(),
                        color: AppColors.accent,
                        width: 12,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(4),
                        ),
                      ),
                      BarChartRodData(
                        toY: bc.toDouble(),
                        color: AppColors.success,
                        width: 12,
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

  String _shortMonthLabel(String yearMonth) {
    // "2025-01" → "Jan"
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
    final parts = yearMonth.split('-');
    if (parts.length == 2) {
      final m = int.tryParse(parts[1]);
      if (m != null && m >= 1 && m <= 12) return months[m - 1];
    }
    return yearMonth;
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

// ── Shared helpers ──────────────────────────────────────────────────

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
    return AppCard(
      padding: const EdgeInsets.all(24),
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
