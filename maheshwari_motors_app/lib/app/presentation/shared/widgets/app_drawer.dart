import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:maheshwari_motors_app/app/presentation/shared/widgets/drawer/drawer_item.dart';
import 'package:maheshwari_motors_app/app/presentation/shared/widgets/drawer/drawer_section_divider.dart';
import 'package:maheshwari_motors_app/app/presentation/shared/widgets/drawer/drawer_section_header.dart';
import '../../../core/theme/app_theme.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/auth/auth_controller.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  void _navigate(String route, {dynamic arguments}) {
    Get.back();
    if (Get.currentRoute == route) return;
    Get.offNamed(route, arguments: arguments);
  }

  @override
  Widget build(BuildContext context) {
    final auth = Get.find<AuthController>();
    final currentRoute = Get.currentRoute;

    return Drawer(
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.horizontal(right: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.accent, AppColors.accentDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(
                  bottomRight: Radius.circular(24),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.business_rounded,
                      color: AppColors.white,
                      size: 26,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Obx(
                    () => Text(
                      auth.firmData?.name ??
                          auth.user.value?.name ??
                          'Maheshwari Motors',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.white,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Obx(
                    () => Text(
                      auth.isAdminLogin
                          ? 'Admin'
                          : auth.firmData?.firmType ?? '',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: Obx(() {
                final isFirm = auth.isFirmLogin;
                return ListView(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  children: [
                    DrawerItem(
                      icon: Icons.dashboard_rounded,
                      label: 'Dashboard',
                      isActive: currentRoute == AppRoutes.home,
                      onTap: () => _navigate(AppRoutes.home),
                    ),

                    const DrawerSectionDivider(),

                    const DrawerSectionHeader(title: 'Masters'),
                    if (auth.isMainUser)
                      DrawerItem(
                        icon: Icons.people_rounded,
                        label: 'User Master',
                        isActive: currentRoute == AppRoutes.userMaster,
                        onTap: () => _navigate(AppRoutes.userMaster),
                      ),
                    if (isFirm) ...[
                      DrawerItem(
                        icon: Icons.groups_rounded,
                        label: 'Party Master',
                        isActive: currentRoute == AppRoutes.partyMaster,
                        onTap: () => _navigate(AppRoutes.partyMaster),
                      ),
                      DrawerItem(
                        icon: Icons.account_balance_rounded,
                        label: 'Account Master',
                        isActive: currentRoute == AppRoutes.accountMaster,
                        onTap: () => _navigate(AppRoutes.accountMaster),
                      ),
                    ],

                    if (isFirm) ...[
                      const DrawerSectionDivider(),

                      const DrawerSectionHeader(title: 'Inventory'),
                      DrawerItem(
                        icon: Icons.inventory_2_rounded,
                        label: 'Item Master',
                        isActive: currentRoute == AppRoutes.itemMaster,
                        onTap: () => _navigate(AppRoutes.itemMaster),
                      ),
                      DrawerItem(
                        icon: Icons.view_list_rounded,
                        label: 'Item View',
                        isActive: currentRoute == AppRoutes.itemView,
                        onTap: () => _navigate(AppRoutes.itemView),
                      ),
                      DrawerItem(
                        icon: Icons.category_rounded,
                        label: 'Category Master',
                        isActive: currentRoute == AppRoutes.categoryMaster,
                        onTap: () => _navigate(AppRoutes.categoryMaster),
                      ),
                      DrawerItem(
                        icon: Icons.local_shipping_rounded,
                        label: 'Supplier Master',
                        isActive: currentRoute == AppRoutes.supplierMaster,
                        onTap: () => _navigate(AppRoutes.supplierMaster),
                      ),
                      DrawerItem(
                        icon: Icons.warning_amber_rounded,
                        label: 'Stock Alerts',
                        isActive: currentRoute == AppRoutes.stockAlertMaster,
                        onTap: () => _navigate(AppRoutes.stockAlertMaster),
                      ),

                      const DrawerSectionDivider(),

                      const DrawerSectionHeader(title: 'Transactions'),
                      DrawerItem(
                        icon: Icons.receipt_long_rounded,
                        label: 'Challans',
                        isActive: currentRoute == AppRoutes.challanList,
                        onTap: () => _navigate(AppRoutes.challanList),
                      ),
                      DrawerItem(
                        icon: Icons.description_rounded,
                        label: 'Bills',
                        isActive: currentRoute == AppRoutes.billList,
                        onTap: () => _navigate(AppRoutes.billList),
                      ),
                      DrawerItem(
                        icon: Icons.shopping_cart_rounded,
                        label: 'Purchases',
                        isActive: currentRoute == AppRoutes.purchaseMaster,
                        onTap: () => _navigate(AppRoutes.purchaseMaster),
                      ),
                      DrawerItem(
                        icon: Icons.swap_horiz_rounded,
                        label: 'Transactions',
                        isActive: currentRoute == AppRoutes.transactionHistory,
                        onTap: () => _navigate(AppRoutes.transactionHistory),
                      ),
                      DrawerItem(
                        icon: Icons.percent_rounded,
                        label: 'Discounts',
                        isActive: currentRoute == AppRoutes.discountMaster,
                        onTap: () => _navigate(AppRoutes.discountMaster),
                      ),

                      const DrawerSectionDivider(),

                      const DrawerSectionHeader(title: 'Reports'),
                      DrawerItem(
                        icon: Icons.bar_chart_rounded,
                        label: 'Business Reports',
                        isActive: false,
                        onTap: () => _navigate(
                          AppRoutes.report,
                          arguments: 'Business Reports',
                        ),
                      ),
                      DrawerItem(
                        icon: Icons.receipt_rounded,
                        label: 'GST Report',
                        isActive: false,
                        onTap: () => _navigate(
                          AppRoutes.report,
                          arguments: 'GST Report',
                        ),
                      ),
                      DrawerItem(
                        icon: Icons.point_of_sale_rounded,
                        label: 'Sales Report',
                        isActive: false,
                        onTap: () => _navigate(
                          AppRoutes.report,
                          arguments: 'Sales Report',
                        ),
                      ),

                      const DrawerSectionDivider(),

                      DrawerItem(
                        icon: Icons.help_outline_rounded,
                        label: 'Help & Support',
                        isActive: currentRoute == AppRoutes.helpSupport,
                        onTap: () => _navigate(AppRoutes.helpSupport),
                      ),
                    ],

                    const DrawerSectionDivider(),

                    const DrawerSectionHeader(title: 'Account'),
                    DrawerItem(
                      icon: Icons.lock_outline_rounded,
                      label: 'Change Password',
                      isActive: currentRoute == AppRoutes.changePassword,
                      onTap: () => _navigate(AppRoutes.changePassword),
                    ),
                    DrawerItem(
                      icon: Icons.devices_rounded,
                      label: 'Active Sessions',
                      isActive: currentRoute == AppRoutes.activeSessions,
                      onTap: () => _navigate(AppRoutes.activeSessions),
                    ),
                    DrawerItem(
                      icon: Icons.logout_rounded,
                      label: 'Logout',
                      isActive: false,
                      color: AppColors.error,
                      onTap: () {
                        Get.back();
                        auth.logout();
                      },
                    ),
                    const SizedBox(height: 8),
                  ],
                );
              }),
            ),

            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: AppColors.border.withValues(alpha: 0.5),
                  ),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline_rounded,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Maheshwari Motors v1.0.0',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
