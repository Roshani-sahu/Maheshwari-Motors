import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/auth_controller.dart';

class AppDrawerButton extends StatelessWidget {
  const AppDrawerButton({super.key});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.menu_rounded),
      onPressed: () => Scaffold.of(context).openDrawer(),
    );
  }
}

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  void _navigate(String route, {dynamic arguments}) {
    Get.back(); // close drawer first
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
            // ── Header ──
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
                      auth.selectedFirm.value?.name ?? 'Maheshwari Motors',
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
                      auth.user.value?.username ?? '',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── Menu items ──
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _DrawerItem(
                    icon: Icons.dashboard_rounded,
                    label: 'Dashboard',
                    isActive: currentRoute == AppRoutes.home,
                    onTap: () => _navigate(AppRoutes.home),
                  ),

                  const _SectionDivider(),

                  // ── Masters ──
                  const _DrawerSectionHeader(title: 'Masters'),
                  Obx(() {
                    final items = <Widget>[
                      _DrawerItem(
                        icon: Icons.business_rounded,
                        label: 'Firm Master',
                        isActive: currentRoute == AppRoutes.firmMaster,
                        onTap: () => _navigate(AppRoutes.firmMaster),
                      ),
                    ];
                    if (auth.isMainUser) {
                      items.add(_DrawerItem(
                        icon: Icons.people_rounded,
                        label: 'User Master',
                        isActive: currentRoute == AppRoutes.userMaster,
                        onTap: () => _navigate(AppRoutes.userMaster),
                      ));
                    }
                    items.addAll([
                      _DrawerItem(
                        icon: Icons.groups_rounded,
                        label: 'Party Master',
                        isActive: currentRoute == AppRoutes.partyMaster,
                        onTap: () => _navigate(AppRoutes.partyMaster),
                      ),
                      _DrawerItem(
                        icon: Icons.account_balance_rounded,
                        label: 'Account Master',
                        isActive: currentRoute == AppRoutes.accountMaster,
                        onTap: () => _navigate(AppRoutes.accountMaster),
                      ),
                    ]);
                    return Column(children: items);
                  }),

                  const _SectionDivider(),

                  // ── Inventory ──
                  const _DrawerSectionHeader(title: 'Inventory'),
                  _DrawerItem(
                    icon: Icons.inventory_2_rounded,
                    label: 'Item Master',
                    isActive: currentRoute == AppRoutes.itemMaster,
                    onTap: () => _navigate(AppRoutes.itemMaster),
                  ),
                  _DrawerItem(
                    icon: Icons.view_list_rounded,
                    label: 'Item View',
                    isActive: currentRoute == AppRoutes.itemView,
                    onTap: () => _navigate(AppRoutes.itemView),
                  ),
                  _DrawerItem(
                    icon: Icons.category_rounded,
                    label: 'Category Master',
                    isActive: currentRoute == AppRoutes.categoryMaster,
                    onTap: () => _navigate(AppRoutes.categoryMaster),
                  ),
                  _DrawerItem(
                    icon: Icons.local_shipping_rounded,
                    label: 'Supplier Master',
                    isActive: currentRoute == AppRoutes.supplierMaster,
                    onTap: () => _navigate(AppRoutes.supplierMaster),
                  ),
                  _DrawerItem(
                    icon: Icons.warning_amber_rounded,
                    label: 'Stock Alerts',
                    isActive: currentRoute == AppRoutes.stockAlertMaster,
                    onTap: () => _navigate(AppRoutes.stockAlertMaster),
                  ),

                  const _SectionDivider(),

                  // ── Transactions ──
                  const _DrawerSectionHeader(title: 'Transactions'),
                  _DrawerItem(
                    icon: Icons.receipt_long_rounded,
                    label: 'Challans',
                    isActive: currentRoute == AppRoutes.challanList,
                    onTap: () => _navigate(AppRoutes.challanList),
                  ),
                  _DrawerItem(
                    icon: Icons.description_rounded,
                    label: 'Bills',
                    isActive: currentRoute == AppRoutes.billList,
                    onTap: () => _navigate(AppRoutes.billList),
                  ),
                  _DrawerItem(
                    icon: Icons.shopping_cart_rounded,
                    label: 'Purchases',
                    isActive: currentRoute == AppRoutes.purchaseMaster,
                    onTap: () => _navigate(AppRoutes.purchaseMaster),
                  ),
                  _DrawerItem(
                    icon: Icons.swap_horiz_rounded,
                    label: 'Transactions',
                    isActive: currentRoute == AppRoutes.transactionHistory,
                    onTap: () => _navigate(AppRoutes.transactionHistory),
                  ),
                  _DrawerItem(
                    icon: Icons.percent_rounded,
                    label: 'Discounts',
                    isActive: currentRoute == AppRoutes.discountMaster,
                    onTap: () => _navigate(AppRoutes.discountMaster),
                  ),

                  const _SectionDivider(),

                  // ── Reports ──
                  const _DrawerSectionHeader(title: 'Reports'),
                  _DrawerItem(
                    icon: Icons.bar_chart_rounded,
                    label: 'Business Reports',
                    isActive: false,
                    onTap: () => _navigate(
                      AppRoutes.report,
                      arguments: 'Business Reports',
                    ),
                  ),
                  _DrawerItem(
                    icon: Icons.receipt_rounded,
                    label: 'GST Report',
                    isActive: false,
                    onTap: () => _navigate(
                      AppRoutes.report,
                      arguments: 'GST Report',
                    ),
                  ),
                  _DrawerItem(
                    icon: Icons.point_of_sale_rounded,
                    label: 'Sales Report',
                    isActive: false,
                    onTap: () => _navigate(
                      AppRoutes.report,
                      arguments: 'Sales Report',
                    ),
                  ),

                  const _SectionDivider(),

                  // ── Help ──
                  _DrawerItem(
                    icon: Icons.help_outline_rounded,
                    label: 'Help & Support',
                    isActive: currentRoute == AppRoutes.helpSupport,
                    onTap: () => _navigate(AppRoutes.helpSupport),
                  ),

                  const _SectionDivider(),

                  // ── Account ──
                  const _DrawerSectionHeader(title: 'Account'),
                  _DrawerItem(
                    icon: Icons.lock_outline_rounded,
                    label: 'Change Password',
                    isActive: currentRoute == AppRoutes.changePassword,
                    onTap: () => _navigate(AppRoutes.changePassword),
                  ),
                  _DrawerItem(
                    icon: Icons.devices_rounded,
                    label: 'Active Sessions',
                    isActive: currentRoute == AppRoutes.activeSessions,
                    onTap: () => _navigate(AppRoutes.activeSessions),
                  ),
                  _DrawerItem(
                    icon: Icons.swap_horiz_rounded,
                    label: 'Switch Firm',
                    isActive: false,
                    onTap: () {
                      Get.back();
                      auth.switchFirm();
                    },
                  ),
                  _DrawerItem(
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
              ),
            ),

            // ── Version ──
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: AppColors.border.withValues(alpha: 0.5)),
                ),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline_rounded,
                      size: 14, color: AppColors.textSecondary),
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

// ── Private helper widgets ──

class _DrawerSectionHeader extends StatelessWidget {
  final String title;
  const _DrawerSectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 6),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: AppColors.textSecondary,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.3,
          fontSize: 10,
        ),
      ),
    );
  }
}

class _SectionDivider extends StatelessWidget {
  const _SectionDivider();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Divider(height: 1, color: AppColors.border.withValues(alpha: 0.4)),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isActive;
  final Color? color;

  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.isActive,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final activeColor = color ?? AppColors.accent;
    final inactiveColor = color ?? AppColors.textSecondary;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 1),
      child: Material(
        color: isActive ? AppColors.accentLight : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
            child: Row(
              children: [
                Icon(
                  icon,
                  size: 21,
                  color: isActive ? activeColor : inactiveColor,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    label,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: isActive ? activeColor : (color ?? AppColors.textPrimary),
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                    ),
                  ),
                ),
                if (isActive)
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: activeColor,
                      shape: BoxShape.circle,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
