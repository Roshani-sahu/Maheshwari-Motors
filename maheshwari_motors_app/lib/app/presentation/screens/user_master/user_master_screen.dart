import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../data/models/user_model.dart';
import '../../../data/services/api_service.dart';
import '../../../routes/app_routes.dart';

class UserMasterController extends GetxController {
  final ApiService _api = ApiService();
  final RxList<UserModel> users = <UserModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadUsers();
  }

  Future<void> loadUsers() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      users.value = await _api.getUsers();
    } catch (e) {
      errorMessage.value = 'Failed to load users';
    }
    isLoading.value = false;
  }

  Future<void> deleteUser(String id) async {
    try {
      await _api.deleteUser(id);
      users.removeWhere((u) => u.id == id);
      AppSnackbar.success('User deleted');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}

class UserMasterScreen extends StatelessWidget {
  const UserMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(UserMasterController());

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('User Master'),
        actions: [
          IconButton(
            onPressed: () async {
              final result = await Get.toNamed(AppRoutes.addUser);
              if (result == true) controller.loadUsers();
            },
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.accent,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.add, color: AppColors.white, size: 18),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }
        if (controller.errorMessage.isNotEmpty) {
          return ErrorState(
            message: controller.errorMessage.value,
            onRetry: controller.loadUsers,
          );
        }
        if (controller.users.isEmpty) {
          return const EmptyState(
            icon: Icons.people_outline,
            title: 'No users yet',
            subtitle: 'Add secondary users to manage your firms',
          );
        }
        return RefreshIndicator(
          onRefresh: controller.loadUsers,
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: controller.users.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final user = controller.users[index];
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border, width: 0.5),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: AppColors.accentLight,
                      child: Text(
                        user.username.isNotEmpty
                            ? user.username[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                          color: AppColors.accent,
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user.username,
                            style: Theme.of(context).textTheme.titleSmall
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            user.email,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    StatusBadge(
                      label: user.type.toUpperCase(),
                      color: user.isMain
                          ? AppColors.successLight
                          : AppColors.infoLight,
                      textColor: user.isMain
                          ? AppColors.success
                          : AppColors.info,
                    ),
                    const SizedBox(width: 8),
                    if (!user.isMain)
                      PopupMenuButton<String>(
                        icon: const Icon(
                          Icons.more_vert,
                          size: 20,
                          color: AppColors.textSecondary,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        onSelected: (v) {
                          if (v == 'edit') {
                            Get.toNamed(
                              AppRoutes.editUser,
                              arguments: user,
                            )?.then((result) {
                              if (result == true) controller.loadUsers();
                            });
                          } else if (v == 'delete') {
                            _confirmDelete(context, controller, user);
                          }
                        },
                        itemBuilder: (_) => [
                          const PopupMenuItem(
                            value: 'edit',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.edit_outlined,
                                  size: 18,
                                  color: AppColors.accent,
                                ),
                                SizedBox(width: 8),
                                Text('Edit'),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.delete_outline,
                                  size: 18,
                                  color: AppColors.error,
                                ),
                                SizedBox(width: 8),
                                Text('Delete'),
                              ],
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              );
            },
          ),
        );
      }),
    );
  }

  void _confirmDelete(
    BuildContext context,
    UserMasterController controller,
    UserModel user,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            const Icon(Icons.delete_outline, color: AppColors.error, size: 36),
            const SizedBox(height: 16),
            Text(
              'Delete "${user.username}"?',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    text: 'Cancel',
                    isOutlined: true,
                    onPressed: () => Get.back(),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: AppButton(
                    text: 'Delete',
                    color: AppColors.error,
                    onPressed: () {
                      Get.back();
                      controller.deleteUser(user.id);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
