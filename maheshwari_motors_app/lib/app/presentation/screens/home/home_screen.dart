import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/home_controller.dart';
import '../../shared/widgets/app_drawer.dart';
import '../dashboard/dashboard_screen.dart';
import '../item_master/item_master_screen.dart';
import '../party/party_master_screen.dart';
import '../challan/challan_list_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(HomeController());

    final tabs = <Widget>[
      const DashboardScreen(),
      const ItemMasterScreen(),
      const PartyMasterScreen(),
      const ChallanListScreen(),
    ];

    return Scaffold(
      key: controller.scaffoldKey,
      drawer: const AppDrawer(),
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
