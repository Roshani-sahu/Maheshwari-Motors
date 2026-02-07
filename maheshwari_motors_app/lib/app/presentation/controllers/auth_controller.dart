import 'package:get/get.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';

import '../../core/constants/app_constants.dart';
import '../../core/network/api_client.dart';
import '../../data/models/user_model.dart';
import '../../data/models/firm_model.dart';
import '../../data/services/api_service.dart';
import '../../routes/app_routes.dart';

class AuthController extends GetxController {
  final ApiService _api = ApiService();
  final ApiClient _client = Get.find<ApiClient>();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  final Rx<UserModel?> user = Rx<UserModel?>(null);
  final Rx<FirmModel?> selectedFirm = Rx<FirmModel?>(null);
  final RxBool isLoading = false.obs;

  bool get isLoggedIn => user.value != null;
  bool get isMainUser => user.value?.isMain ?? false;
  String get firmId => selectedFirm.value?.id ?? '';

  @override
  void onInit() {
    super.onInit();
    checkAuth();
  }

  Future<void> checkAuth() async {
    final token = await _client.getToken();
    if (token != null) {
      try {
        final profile = await _api.getProfile();
        user.value = profile;
        // Try to restore selected firm
        final firmJson = await _storage.read(key: AppConstants.selectedFirmKey);
        if (firmJson != null) {
          selectedFirm.value = FirmModel.fromJson(jsonDecode(firmJson));
          Get.offAllNamed(AppRoutes.home);
        } else {
          Get.offAllNamed(AppRoutes.firmSelection);
        }
      } catch (_) {
        await _client.clearToken();
        Get.offAllNamed(AppRoutes.login);
      }
    } else {
      Get.offAllNamed(AppRoutes.login);
    }
  }

  Future<bool> login(String username, String password) async {
    isLoading.value = true;
    try {
      final res = await _api.login(username, password);
      final data = res['data'];
      final token = data['token'] ?? data['user']?['token'];
      if (token != null) {
        await _client.setToken(token);
      }
      user.value = UserModel.fromJson(data['user'] ?? data);
      isLoading.value = false;
      return true;
    } catch (e) {
      isLoading.value = false;
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _api.logout();
    } catch (_) {}
    user.value = null;
    selectedFirm.value = null;
    await _client.clearToken();
    await _storage.delete(key: AppConstants.selectedFirmKey);
    Get.offAllNamed(AppRoutes.login);
  }

  Future<void> selectFirm(FirmModel firm) async {
    selectedFirm.value = firm;
    await _storage.write(
      key: AppConstants.selectedFirmKey,
      value: jsonEncode(firm.toJson()..['_id'] = firm.id),
    );
    Get.offAllNamed(AppRoutes.home);
  }

  Future<void> switchFirm() async {
    selectedFirm.value = null;
    await _storage.delete(key: AppConstants.selectedFirmKey);
    Get.offAllNamed(AppRoutes.firmSelection);
  }
}
