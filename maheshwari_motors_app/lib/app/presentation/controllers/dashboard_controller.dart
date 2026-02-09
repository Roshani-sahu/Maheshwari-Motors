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
}
