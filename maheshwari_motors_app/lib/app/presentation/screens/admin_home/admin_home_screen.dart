import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/user_model.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/auth_controller.dart';
import '../../controllers/user_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';

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
                    return _AdminUserCard(
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

class _AdminUserCard extends StatelessWidget {
  final UserModel user;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onToggleActive;

  const _AdminUserCard({
    required this.user,
    required this.onEdit,
    required this.onDelete,
    required this.onToggleActive,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: user.isActive
                ? AppColors.accentLight
                : AppColors.errorLight,
            child: Text(
              user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
              style: TextStyle(
                color: user.isActive ? AppColors.accent : AppColors.error,
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
                  user.name,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 3),
                Text(
                  user.email ?? '',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          StatusBadge(
            label: user.isActive ? 'ACTIVE' : 'INACTIVE',
            color: user.isActive
                ? AppColors.successLight
                : AppColors.errorLight,
            textColor: user.isActive ? AppColors.success : AppColors.error,
          ),
          const SizedBox(width: 4),
          if (!user.isMain)
            PopupMenuButton<String>(
              icon: const Icon(
                Icons.more_vert_rounded,
                size: 20,
                color: AppColors.textSecondary,
              ),
              onSelected: (value) {
                switch (value) {
                  case 'edit':
                    onEdit();
                    break;
                  case 'toggle':
                    onToggleActive();
                    break;
                  case 'delete':
                    onDelete();
                    break;
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'edit',
                  child: ListTile(
                    dense: true,
                    leading: Icon(Icons.edit_rounded, size: 18),
                    title: Text('Edit'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                PopupMenuItem(
                  value: 'toggle',
                  child: ListTile(
                    dense: true,
                    leading: Icon(
                      user.isActive
                          ? Icons.block_rounded
                          : Icons.check_circle_outline_rounded,
                      size: 18,
                      color: user.isActive
                          ? AppColors.warning
                          : AppColors.success,
                    ),
                    title: Text(user.isActive ? 'Deactivate' : 'Reactivate'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                const PopupMenuDivider(),
                PopupMenuItem(
                  value: 'delete',
                  child: ListTile(
                    dense: true,
                    leading: Icon(
                      Icons.delete_outline_rounded,
                      size: 18,
                      color: AppColors.error,
                    ),
                    title: Text(
                      'Delete',
                      style: TextStyle(color: AppColors.error),
                    ),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
