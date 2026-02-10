import 'package:get/get.dart';

import '../../data/models/bill_model.dart';
import '../../data/models/challan_model.dart';
import '../../data/services/api_service.dart';
import 'auth_controller.dart';

class DashboardController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final AuthController _auth = Get.find<AuthController>();

  final RxBool isLoading = true.obs;
  final RxMap<String, dynamic> dashboardData = <String, dynamic>{}.obs;
  final RxString errorMessage = ''.obs;
  final RxList<ChallanModel> recentChallans = <ChallanModel>[].obs;
  final RxList<BillModel> recentBills = <BillModel>[].obs;

  /// Active filter: 'today' | 'last_month' | 'last_year' | 'all_time'
  final RxString selectedPeriod = 'all_time'.obs;

  static const List<String> periodOptions = [
    'today',
    'last_month',
    'last_year',
    'all_time',
  ];

  static String periodLabel(String period) {
    switch (period) {
      case 'today':
        return 'Today';
      case 'last_month':
        return 'Last Month';
      case 'last_year':
        return 'Last Year';
      case 'all_time':
        return 'All Time';
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
      final firmId = _auth.firmId;
      if (firmId.isNotEmpty) {
        final data = await _api.getFirmDashboard(
          firmId,
          period: selectedPeriod.value,
        );
        dashboardData.value = data;
        recentChallans.value = (data['recent_challans'] as List? ?? [])
            .map((e) => ChallanModel.fromJson(e as Map<String, dynamic>))
            .toList();
        recentBills.value = (data['recent_bills'] as List? ?? [])
            .map((e) => BillModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      errorMessage.value = 'Failed to load dashboard';
    }
    isLoading.value = false;
  }

  // ── Challan stats ──
  int get totalChallans => (dashboardData['challans'] as Map?)?['total'] ?? 0;
  double get challanAmount =>
      ((dashboardData['challans'] as Map?)?['total_amount'] ?? 0).toDouble();

  // ── Bill stats ──
  int get totalBills => (dashboardData['bills'] as Map?)?['total'] ?? 0;
  int get dueBills => (dashboardData['bills'] as Map?)?['due'] ?? 0;
  int get paidBills => (dashboardData['bills'] as Map?)?['paid'] ?? 0;
  double get billAmount =>
      ((dashboardData['bills'] as Map?)?['total_amount'] ?? 0).toDouble();
  double get totalPaid =>
      ((dashboardData['bills'] as Map?)?['total_paid'] ?? 0).toDouble();

  // ── Chart data (last 6 months) ──
  Map<String, dynamic> get chartData =>
      (dashboardData['chart'] as Map<String, dynamic>?) ?? {};

  List<Map<String, dynamic>> get challansByMonth =>
      (chartData['challans_by_month'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ??
      [];

  List<Map<String, dynamic>> get billsByMonth =>
      (chartData['bills_by_month'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ??
      [];
}
