import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/user_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../data/models/user_model.dart';
import '../../../routes/app_routes.dart';

class UserMasterScreen extends StatelessWidget {
  const UserMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(UserMasterController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('User Master'),
        actions: [
          AppBarAddButton(
            onPressed: () async {
              final result = await Get.toNamed(AppRoutes.addUser);
              if (result == true) controller.loadUsers();
            },
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
                    return _UserCard(
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

class _UserCard extends StatelessWidget {
  final UserModel user;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _UserCard({
    required this.user,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: AppColors.accentLight,
            child: Text(
              user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
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
            label: user.type.toUpperCase(),
            color: user.isMain ? AppColors.successLight : AppColors.infoLight,
            textColor: user.isMain ? AppColors.success : AppColors.info,
          ),
          const SizedBox(width: 8),
          if (!user.isMain) AppPopupMenu(onEdit: onEdit, onDelete: onDelete),
        ],
      ),
    );
  }
}
