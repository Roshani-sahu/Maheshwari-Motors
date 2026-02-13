import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/auth/auth_controller.dart';
import '../../controllers/user_master/user_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/admin_user_card.dart';

class AdminHomeScreen extends StatelessWidget {
  const AdminHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(UserMasterController());
    final auth = Get.find<AuthController>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('User Management'),
        automaticallyImplyLeading: false,
        actions: [
          AppBarAddButton(
            onPressed: () async {
              final result = await Get.toNamed(AppRoutes.addUser);
              if (result == true) controller.loadUsers();
            },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded),
            onSelected: (value) {
              switch (value) {
                case 'password':
                  Get.toNamed(AppRoutes.changePassword);
                  break;
                case 'sessions':
                  Get.toNamed(AppRoutes.activeSessions);
                  break;
                case 'logout':
                  auth.logout();
                  break;
              }
            },
            itemBuilder: (_) => [
              const PopupMenuItem(
                value: 'password',
                child: ListTile(
                  dense: true,
                  leading: Icon(Icons.lock_outline_rounded, size: 20),
                  title: Text('Change Password'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const PopupMenuItem(
                value: 'sessions',
                child: ListTile(
                  dense: true,
                  leading: Icon(Icons.devices_rounded, size: 20),
                  title: Text('Active Sessions'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const PopupMenuDivider(),
              PopupMenuItem(
                value: 'logout',
                child: ListTile(
                  dense: true,
                  leading: Icon(
                    Icons.logout_rounded,
                    size: 20,
                    color: AppColors.error,
                  ),
                  title: Text(
                    'Logout',
                    style: TextStyle(color: AppColors.error),
                  ),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          AppSearchBar(
            hint: 'Search by username or email…',
            onChanged: (v) => controller.searchQuery.value = v,
          ),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }
              if (controller.errorMessage.isNotEmpty) {
                return ErrorState(
                  message: controller.errorMessage.value,
                  onRetry: controller.loadUsers,
                );
              }
              if (controller.filtered.isEmpty) {
                return const EmptyState(
                  icon: Icons.people_outline,
                  title: 'No users found',
                  subtitle: 'Add secondary users to manage your firms',
                );
              }
              return RefreshIndicator(
                onRefresh: controller.loadUsers,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: controller.filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final user = controller.filtered[index];
                    return AdminUserCard(
                      user: user,
                      onEdit: () {
                        Get.toNamed(AppRoutes.editUser, arguments: user)?.then((
                          result,
                        ) {
                          if (result == true) controller.loadUsers();
                        });
                      },
                      onDelete: () => DeleteConfirmSheet.show(
                        context: context,
                        title: 'Delete "${user.name}"?',
                        subtitle: 'This action cannot be undone.',
                        onConfirm: () => controller.deleteUser(user.id),
                      ),
                      onToggleActive: () => controller.toggleUserActive(user),
                    );
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
