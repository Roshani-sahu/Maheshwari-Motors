import 'package:get/get.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'dart:io';

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

  final Rx<UserModel?> user = Rx<UserModel?>(null);
  final RxBool isLoading = false.obs;

  bool get isLoggedIn => user.value != null;
  bool get isMainUser => user.value?.isMain ?? false;
  bool get isAdminLogin => user.value?.isAdminLogin ?? false;
  bool get isFirmLogin => user.value?.isFirmLogin ?? false;
  String get currentRole => user.value?.role ?? '';
  String get firmType => user.value?.firmType ?? '';
  FirmDataModel? get firmData => user.value?.firmData;

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
          Get.offAllNamed(AppRoutes.home);
        } catch (e) {
          await _client.clearToken();
          Get.offAllNamed(AppRoutes.login);
        }
      } else {
        Get.offAllNamed(AppRoutes.login);
      }
    } catch (e) {
      Get.offAllNamed(AppRoutes.login);
    }
  }

  Future<bool> loginAdmin(String username, String password) async {
    isLoading.value = true;
    try {
      final deviceInfo = await _getDeviceInfo();
      final res = await _api.loginAdmin(
        username,
        password,
        deviceName: deviceInfo['device_name'],
        deviceType: deviceInfo['device_type'],
      );
      final data = res['data'];
      if (data == null) throw Exception('Invalid login response');
      final token = data['token'];
      if (token == null) throw Exception('No token received');
      await _client.setToken(token);
      user.value = UserModel.fromLoginJson(data);
      isLoading.value = false;
      return true;
    } catch (e) {
      isLoading.value = false;
      rethrow;
    }
  }

  Future<bool> loginFirm(String username, String password) async {
    isLoading.value = true;
    try {
      final deviceInfo = await _getDeviceInfo();
      final res = await _api.loginFirm(
        username,
        password,
        deviceName: deviceInfo['device_name'],
        deviceType: deviceInfo['device_type'],
      );
      final data = res['data'];
      if (data == null) throw Exception('Invalid login response');
      final token = data['token'];
      if (token == null) throw Exception('No token received');
      await _client.setToken(token);
      user.value = UserModel.fromLoginJson(data);
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
    await _client.clearToken();
    _deleteTabControllers();
    Get.offAllNamed(AppRoutes.login);
  }

  void _deleteTabControllers() {
    Get.delete<DashboardController>(force: true);
    Get.delete<HomeController>(force: true);
  }
}
