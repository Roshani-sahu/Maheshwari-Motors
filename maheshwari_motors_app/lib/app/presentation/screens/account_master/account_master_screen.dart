import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../controllers/account_master/account_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/discounts_tab.dart';
import 'widgets/transactions_tab.dart';

class AccountMasterScreen extends StatelessWidget {
  const AccountMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.put(AccountMasterController());

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        drawer: const AppDrawer(),
        backgroundColor: AppColors.background,
        appBar: AppBar(
          leading: const AppDrawerButton(),
          title: const Text('Account Master'),
          bottom: const TabBar(
            labelColor: AppColors.accent,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.accent,
            indicatorSize: TabBarIndicatorSize.label,
            tabs: [
              Tab(icon: Icon(Icons.swap_horiz, size: 18), text: 'Transactions'),
              Tab(icon: Icon(Icons.percent, size: 18), text: 'Discounts'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            TransactionsTab(c: c),
            DiscountsTab(c: c),
          ],
        ),
      ),
    );
  }
}
