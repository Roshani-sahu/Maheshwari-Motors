import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_theme.dart';
import '../../controllers/account_master/account_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/transactions_tab.dart';

class AccountMasterScreen extends StatelessWidget {
  const AccountMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Get.put(AccountMasterController());

    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('Account Master'),
      ),
      body: TransactionsTab(c: c),
    );
  }
}
