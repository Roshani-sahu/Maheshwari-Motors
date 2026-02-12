import 'package:get/get.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'dart:convert';
import 'dart:io';

import '../../core/constants/app_constants.dart';
import '../../core/network/api_client.dart';
import '../../data/models/user_model.dart';
import '../../data/models/firm_model.dart';
import '../../data/services/api_service.dart';
import '../../routes/app_routes.dart';
import 'dashboard_controller.dart';
import 'home_controller.dart';

class AuthController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final ApiClient _client = Get.find<ApiClient>();
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(resetOnError: true),
  );

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
    await Future.delayed(const Duration(milliseconds: 1500));
    try {
      final token = await _client.getToken().timeout(
        const Duration(seconds: 3),
        onTimeout: () => null,
      );
      if (token != null) {
        try {
          final profile = await _api.getProfile();
          user.value = profile;
          // Try to restore selected firm
          final firmJson = await _storage
              .read(key: AppConstants.selectedFirmKey)
              .timeout(const Duration(seconds: 3), onTimeout: () => null);
          if (firmJson != null) {
            selectedFirm.value = FirmModel.fromJson(jsonDecode(firmJson));
            Get.offAllNamed(AppRoutes.home);
          } else {
            Get.offAllNamed(AppRoutes.firmSelection);
          }
        } catch (e) {
          await _client.clearToken();
          Get.offAllNamed(AppRoutes.login);
        }
      } else {
        Get.offAllNamed(AppRoutes.login);
      }
    } catch (e) {
      // Storage or other platform error — fall back to login
      Get.offAllNamed(AppRoutes.login);
    }
  }

  Future<bool> login(String username, String password) async {
    isLoading.value = true;
    try {
      // Get device info
      final deviceInfo = await _getDeviceInfo();

      final res = await _api.login(
        username,
        password,
        deviceName: deviceInfo['device_name'],
        deviceType: deviceInfo['device_type'],
      );
      final data = res['data'];
      if (data == null) throw Exception('Invalid login response');
      final token = data['token'] ?? data['user']?['token'];
      if (token == null) throw Exception('No token received');
      await _client.setToken(token);
      user.value = UserModel.fromJson(data['user'] ?? data);
      isLoading.value = false;
      return true;
    } catch (e) {
      isLoading.value = false;
      rethrow;
    }
  }

  Future<Map<String, String>> _getDeviceInfo() async {
    final deviceInfoPlugin = DeviceInfoPlugin();
    try {
      if (Platform.isAndroid) {
        final info = await deviceInfoPlugin.androidInfo;
        return {
          'device_name': '${info.brand} ${info.model}',
          'device_type': 'android',
        };
      } else if (Platform.isIOS) {
        final info = await deviceInfoPlugin.iosInfo;
        return {'device_name': info.utsname.machine, 'device_type': 'ios'};
      }
    } catch (_) {}
    return {'device_name': 'Unknown Device', 'device_type': 'unknown'};
  }

  Future<void> logout() async {
    try {
      await _api.logout();
    } catch (_) {}
    user.value = null;
    selectedFirm.value = null;
    await _client.clearToken();
    await _storage.delete(key: AppConstants.selectedFirmKey);
    _deleteTabControllers();
    Get.offAllNamed(AppRoutes.login);
  }

  Future<void> selectFirm(FirmModel firm) async {
    selectedFirm.value = firm;
    await _storage.write(
      key: AppConstants.selectedFirmKey,
      value: jsonEncode(firm.toJson()),
    );
    Get.offAllNamed(AppRoutes.home);
  }

  Future<void> switchFirm() async {
    selectedFirm.value = null;
    await _storage.delete(key: AppConstants.selectedFirmKey);
    // Delete tab controllers so they are re-created with fresh data
    _deleteTabControllers();
    Get.offAllNamed(AppRoutes.firmSelection);
  }

  /// Deletes controllers so they reload after firm switch.
  void _deleteTabControllers() {
    Get.delete<DashboardController>(force: true);
    Get.delete<HomeController>(force: true);
  }
}
