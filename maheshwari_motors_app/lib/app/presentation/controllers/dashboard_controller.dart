import 'package:get/get.dart';

import '../../data/services/api_service.dart';

class DashboardController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxBool isLoading = true.obs;
  final RxMap<String, dynamic> dashboardData = <String, dynamic>{}.obs;
  final RxString errorMessage = ''.obs;

  final RxString selectedPeriod = 'monthly'.obs;

  static const List<String> periodOptions = ['monthly', 'yearly'];

  static String periodLabel(String period) {
    switch (period) {
      case 'monthly':
        return 'This Month';
      case 'yearly':
        return 'This Year';
      default:
        return period;
    }
  }

  @override
  void onInit() {
    super.onInit();
    loadDashboard();
  }

  void changePeriod(String period) {
    if (selectedPeriod.value == period) return;
    selectedPeriod.value = period;
    loadDashboard();
  }

  Future<void> loadDashboard() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final data = await _api.getFirmDashboard(period: selectedPeriod.value);
      dashboardData.value = data;
    } catch (e) {
      errorMessage.value = 'Failed to load dashboard';
    }
    isLoading.value = false;
  }

  int get totalChallans => (dashboardData['challans'] as num?)?.toInt() ?? 0;
  int get totalBills => (dashboardData['bills'] as num?)?.toInt() ?? 0;
  double get totalRevenue =>
      (dashboardData['total_revenue'] as num?)?.toDouble() ?? 0;
  double get pendingAmount =>
      (dashboardData['pending_amount'] as num?)?.toDouble() ?? 0;
  int get totalTransactions =>
      (dashboardData['transactions'] as num?)?.toInt() ?? 0;
  int get totalPurchases => (dashboardData['purchases'] as num?)?.toInt() ?? 0;
  double get purchaseAmount =>
      (dashboardData['purchase_amount'] as num?)?.toDouble() ?? 0;

  List<Map<String, dynamic>> get monthlyRevenue =>
      (dashboardData['monthly_revenue'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ??
      [];
}
