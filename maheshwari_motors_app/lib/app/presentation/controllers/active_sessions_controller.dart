import 'package:get/get.dart';
import '../../data/services/api_service.dart';

class ActiveSessionsController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<Map<String, dynamic>> sessions = <Map<String, dynamic>>[].obs;
  final RxBool isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    fetchSessions();
  }

  Future<void> fetchSessions() async {
    isLoading.value = true;
    try {
      final result = await _api.getSessions();
      sessions.assignAll(result);
    } catch (e) {
      Get.snackbar('Error', 'Failed to load sessions');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> revokeSession(String sessionId) async {
    try {
      await _api.revokeSession(sessionId);
      sessions.removeWhere((s) => s['_id'] == sessionId);
      Get.snackbar('Success', 'Session revoked');
    } catch (e) {
      Get.snackbar('Error', 'Failed to revoke session');
    }
  }

  Future<void> revokeAllOtherSessions() async {
    try {
      await _api.revokeAllOtherSessions();
      sessions.removeWhere((s) => s['is_current'] != true);
      Get.snackbar('Success', 'All other sessions revoked');
    } catch (e) {
      Get.snackbar('Error', 'Failed to revoke sessions');
    }
  }
}
