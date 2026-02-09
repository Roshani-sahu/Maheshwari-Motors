import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'dashboard_controller.dart';

class HomeController extends GetxController {
  final RxInt currentIndex = 0.obs;
  final RxSet<int> visitedTabs = {0}.obs;
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();

  void switchTab(int index) {
    currentIndex.value = index;
    visitedTabs.add(index);

    // Refresh dashboard when returning to it
    if (index == 0 && Get.isRegistered<DashboardController>()) {
      Get.find<DashboardController>().loadDashboard();
    }
  }

  void openDrawer() => scaffoldKey.currentState?.openDrawer();
}
