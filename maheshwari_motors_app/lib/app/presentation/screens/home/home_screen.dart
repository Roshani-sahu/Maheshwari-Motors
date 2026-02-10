import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/auth_controller.dart';
import '../../controllers/home_controller.dart';
import '../dashboard/dashboard_screen.dart';
import '../item_master/item_master_screen.dart';
import '../party/party_master_screen.dart';
import '../challan/challan_list_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(HomeController());
    final auth = Get.find<AuthController>();

    final tabs = <Widget>[
      const DashboardScreen(),
      const ItemMasterScreen(),
      const PartyMasterScreen(),
      const ChallanListScreen(),
    ];

    return Scaffold(
      key: controller.scaffoldKey,
      drawer: _AppDrawer(auth: auth),
      body: Obx(
        () => IndexedStack(
          index: controller.currentIndex.value,
          children: List.generate(tabs.length, (i) {
            if (!controller.visitedTabs.contains(i)) {
              return const SizedBox.shrink();
            }
            return tabs[i];
          }),
        ),
      ),
      bottomNavigationBar: Obx(
        () => NavigationBar(
          selectedIndex: controller.currentIndex.value,
          onDestinationSelected: controller.switchTab,
          backgroundColor: AppColors.white,
          elevation: 3,
          height: 68,
          indicatorColor: AppColors.accentLight,
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.dashboard_outlined),
              selectedIcon: Icon(Icons.dashboard, color: AppColors.accent),
              label: 'Dashboard',
            ),
            NavigationDestination(
              icon: Icon(Icons.inventory_2_outlined),
              selectedIcon: Icon(Icons.inventory_2, color: AppColors.accent),
              label: 'Items',
            ),
            NavigationDestination(
              icon: Icon(Icons.people_outline),
              selectedIcon: Icon(Icons.people, color: AppColors.accent),
              label: 'Parties',
            ),
            NavigationDestination(
              icon: Icon(Icons.receipt_long_outlined),
              selectedIcon: Icon(Icons.receipt_long, color: AppColors.accent),
              label: 'Challans',
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: AppColors.accent,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                      Icons.business,
                      color: AppColors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Obx(
                    () => Text(
                      auth.selectedFirm.value?.name ?? 'Maheshwari Motors',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Obx(
                    () => Text(
                      auth.user.value?.username ?? '',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // Menu items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _DrawerSection(
                    title: 'Masters',
                    children: [
                      _DrawerItem(
                        icon: Icons.business_outlined,
                        label: 'Firm Master',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.firmMaster);
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.people_outline,
                        label: 'User Master',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.userMaster);
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.account_balance_outlined,
                        label: 'Account Master',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.accountMaster);
                        },
                      ),
                    ],
                  ),
                  _DrawerSection(
                    title: 'Inventory',
                    children: [
                      _DrawerItem(
                        icon: Icons.inventory_2_outlined,
                        label: 'Item Management',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.itemMaster);
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.view_list_outlined,
                        label: 'Item View',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.itemView);
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.category_outlined,
                        label: 'Category Master',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.categoryMaster);
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.grid_view_outlined,
                        label: 'View Category',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.viewCategory);
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.person_add_outlined,
                        label: 'Add Supplier',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.supplierMaster);
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.local_shipping_outlined,
                        label: 'View All Supplier',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.viewAllSupplier);
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.warning_amber_outlined,
                        label: 'Stock Alert Master',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.stockAlertMaster);
                        },
                      ),
                    ],
                  ),
                  _DrawerSection(
                    title: 'Transactions',
                    children: [
                      _DrawerItem(
                        icon: Icons.receipt_long_outlined,
                        label: 'Challan List',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.challanList);
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.description_outlined,
                        label: 'Bill List',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.billList);
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.swap_horiz,
                        label: 'Transaction History',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.transactionHistory);
                        },
                      ),
                    ],
                  ),
                  _DrawerSection(
                    title: 'Reports',
                    children: [
                      _DrawerItem(
                        icon: Icons.bar_chart_outlined,
                        label: 'Business Reports',
                        onTap: () {
                          Get.back();
                          Get.toNamed(
                            AppRoutes.report,
                            arguments: 'Business Reports',
                          );
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.receipt_outlined,
                        label: 'GST Report',
                        onTap: () {
                          Get.back();
                          Get.toNamed(
                            AppRoutes.report,
                            arguments: 'GST Report',
                          );
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.shopping_cart_outlined,
                        label: 'Purchase Report',
                        onTap: () {
                          Get.back();
                          Get.toNamed(
                            AppRoutes.report,
                            arguments: 'Purchase Report',
                          );
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.point_of_sale_outlined,
                        label: 'Sales Report',
                        onTap: () {
                          Get.back();
                          Get.toNamed(
                            AppRoutes.report,
                            arguments: 'Sales Report',
                          );
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.assignment_return_outlined,
                        label: 'Sales Return Report',
                        onTap: () {
                          Get.back();
                          Get.toNamed(
                            AppRoutes.report,
                            arguments: 'Sales Return Report',
                          );
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.keyboard_return_outlined,
                        label: 'Purchase Return Report',
                        onTap: () {
                          Get.back();
                          Get.toNamed(
                            AppRoutes.report,
                            arguments: 'Purchase Return Report',
                          );
                        },
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  _DrawerItem(
                    icon: Icons.help_outline,
                    label: 'Help & Support',
                    onTap: () {
                      Get.back();
                      Get.toNamed(AppRoutes.helpSupport);
                    },
                  ),
                  const Divider(height: 24),
                  _DrawerSection(
                    title: 'Account',
                    children: [
                      _DrawerItem(
                        icon: Icons.lock_outline,
                        label: 'Change Password',
                        onTap: () {
                          Get.back();
                          Get.toNamed(AppRoutes.changePassword);
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.swap_horiz_outlined,
                        label: 'Switch Firm',
                        onTap: () {
                          Get.back();
                          auth.switchFirm();
                        },
                      ),
                      _DrawerItem(
                        icon: Icons.logout,
                        label: 'Logout',
                        color: AppColors.error,
                        onTap: () {
                          Get.back();
                          auth.logout();
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Version
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'v1.0.0',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
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
  final List<Widget> children;
  const _DrawerSection({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Text(
            title.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.2,
            ),
          ),
        ),
        ...children,
      ],
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;
  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, size: 22, color: color ?? AppColors.textSecondary),
      title: Text(
        label,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: color),
      ),
      onTap: onTap,
      dense: true,
      visualDensity: VisualDensity.compact,
    );
  }
}
