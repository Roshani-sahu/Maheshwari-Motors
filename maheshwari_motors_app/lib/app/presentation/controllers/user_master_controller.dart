import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/user_model.dart';
import '../../data/services/api_service.dart';
import '../shared/widgets/common_widgets.dart';

class UserMasterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final RxList<UserModel> users = <UserModel>[].obs;
  final RxList<UserModel> filtered = <UserModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadUsers();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
  }

  Future<void> loadUsers() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      users.value = await _api.getUsers();
      _filter();
    } catch (e) {
      errorMessage.value = 'Failed to load users';
    }
    isLoading.value = false;
  }

  void _filter() {
    if (searchQuery.value.isEmpty) {
      filtered.value = users.toList();
    } else {
      final q = searchQuery.value.toLowerCase();
      filtered.value = users
          .where(
            (u) =>
                u.name.toLowerCase().contains(q) ||
                (u.email?.toLowerCase().contains(q) ?? false),
          )
          .toList();
    }
  }

  Future<void> deleteUser(String id) async {
    try {
      await _api.deleteUser(id);
      users.removeWhere((u) => u.id == id);
      _filter();
      AppSnackbar.success('User deleted');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }

  Future<void> toggleUserActive(UserModel user) async {
    try {
      if (user.isActive) {
        await _api.deactivateUser(user.id);
        AppSnackbar.success('User deactivated');
      } else {
        await _api.reactivateUser(user.id);
        AppSnackbar.success('User reactivated');
      }
      await loadUsers();
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}
