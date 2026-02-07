import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/auth_controller.dart';
import '../dashboard/dashboard_screen.dart';
import '../item_master/item_master_screen.dart';
import '../stock_alert/stock_alert_screen.dart';
import '../challan/challan_list_screen.dart';
import '../transaction/transaction_history_screen.dart';

class HomeController extends GetxController {
  final RxInt currentIndex = 0.obs;
  final RxSet<int> visitedTabs = {0}.obs; // Dashboard loads immediately

  void switchTab(int index) {
    currentIndex.value = index;
    visitedTabs.add(index);
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(HomeController());
    final auth = Get.find<AuthController>();

    final screens = <Widget>[
      const DashboardScreen(),
      const ItemMasterScreen(),
      const StockAlertScreen(),
      const ChallanListScreen(),
      const TransactionHistoryScreen(),
    ];

    return Scaffold(
      body: Obx(
        () => IndexedStack(
          index: controller.currentIndex.value,
          children: List.generate(screens.length, (i) {
            // Only build the screen if the tab has been visited
            if (controller.visitedTabs.contains(i)) {
              return screens[i];
            }
            return const SizedBox.shrink();
          }),
        ),
      ),
      bottomNavigationBar: Obx(
        () => Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 20,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _NavItem(
                    icon: Icons.dashboard_rounded,
                    label: 'Home',
                    isSelected: controller.currentIndex.value == 0,
                    onTap: () => controller.switchTab(0),
                  ),
                  _NavItem(
                    icon: Icons.inventory_2_outlined,
                    label: 'Items',
                    isSelected: controller.currentIndex.value == 1,
                    onTap: () => controller.switchTab(1),
                  ),
                  _NavItem(
                    icon: Icons.warning_amber_rounded,
                    label: 'Stock',
                    isSelected: controller.currentIndex.value == 2,
                    onTap: () => controller.switchTab(2),
                  ),
                  _NavItem(
                    icon: Icons.receipt_long_outlined,
                    label: 'Challans',
                    isSelected: controller.currentIndex.value == 3,
                    onTap: () => controller.switchTab(3),
                  ),
                  _NavItem(
                    icon: Icons.swap_horiz_rounded,
                    label: 'History',
                    isSelected: controller.currentIndex.value == 4,
                    onTap: () => controller.switchTab(4),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      drawer: _AppDrawer(auth: auth),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.accentLight : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 22,
              color: isSelected ? AppColors.accent : AppColors.textSecondary,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected ? AppColors.accent : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AppDrawer extends StatelessWidget {
  final AuthController auth;

  const _AppDrawer({required this.auth});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: AppColors.white,
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(color: AppColors.secondary),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.accent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.precision_manufacturing_rounded,
                      color: AppColors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'ERP System',
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge?.copyWith(color: AppColors.white),
                  ),
                  const SizedBox(height: 4),
                  Obx(
                    () => Text(
                      auth.selectedFirm.value?.name ?? '',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.white.withValues(alpha: 0.7),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Menu items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _DrawerSection(title: 'Masters'),
                  _DrawerItem(
                    icon: Icons.business_rounded,
                    title: 'Firm Master',
                    onTap: () {
                      Get.back();
                      Get.toNamed('/firm-master');
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.inventory_2_outlined,
                    title: 'Item Master',
                    onTap: () {
                      Get.back();
                      Get.find<HomeController>().switchTab(1);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.warning_amber_rounded,
                    title: 'Stock Alert Master',
                    onTap: () {
                      Get.back();
                      Get.find<HomeController>().switchTab(2);
                    },
                  ),
                  if (auth.isMainUser)
                    _DrawerItem(
                      icon: Icons.people_outline,
                      title: 'User Master',
                      onTap: () {
                        Get.back();
                        Get.toNamed('/user-master');
                      },
                    ),
                  _DrawerItem(
                    icon: Icons.person_outline,
                    title: 'Party Master',
                    onTap: () {
                      Get.back();
                      Get.toNamed('/party-master');
                    },
                  ),
                  const Divider(height: 16),
                  _DrawerSection(title: 'Transactions'),
                  _DrawerItem(
                    icon: Icons.receipt_long_outlined,
                    title: 'Challan List',
                    onTap: () {
                      Get.back();
                      Get.find<HomeController>().switchTab(3);
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.description_outlined,
                    title: 'Bill List',
                    onTap: () {
                      Get.back();
                      Get.toNamed('/bill-list');
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.swap_horiz_rounded,
                    title: 'Transaction History',
                    onTap: () {
                      Get.back();
                      Get.find<HomeController>().switchTab(4);
                    },
                  ),
                ],
              ),
            ),

            // Footer
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Column(
                children: [
                  _DrawerItem(
                    icon: Icons.swap_horiz,
                    title: 'Switch Firm',
                    onTap: () {
                      Get.back();
                      auth.switchFirm();
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.logout_rounded,
                    title: 'Logout',
                    color: AppColors.error,
                    onTap: () {
                      Get.back();
                      auth.logout();
                    },
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

class _DrawerSection extends StatelessWidget {
  final String title;

  const _DrawerSection({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          letterSpacing: 1.2,
          color: AppColors.textSecondary,
          fontSize: 11,
        ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Color? color;

  const _DrawerItem({
    required this.icon,
    required this.title,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, size: 22, color: color ?? AppColors.textPrimary),
      title: Text(
        title,
        style: Theme.of(
          context,
        ).textTheme.titleSmall?.copyWith(color: color ?? AppColors.textPrimary),
      ),
      onTap: onTap,
      dense: true,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      visualDensity: VisualDensity.compact,
    );
  }
}
