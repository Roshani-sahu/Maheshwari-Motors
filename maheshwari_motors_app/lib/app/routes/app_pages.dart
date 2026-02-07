import 'package:get/get.dart';

import '../routes/app_routes.dart';
import '../presentation/screens/splash/splash_screen.dart';
import '../presentation/screens/auth/login/login_screen.dart';
import '../presentation/screens/firm_selection/firm_selection_screen.dart';
import '../presentation/screens/home/home_screen.dart';
import '../presentation/screens/firm_master/firm_master_screen.dart';
import '../presentation/screens/firm_master/add_firm_screen.dart';
import '../presentation/screens/item_master/item_master_screen.dart';
import '../presentation/screens/item_master/add_item_screen.dart';
import '../presentation/screens/stock_alert/stock_alert_screen.dart';
import '../presentation/screens/user_master/user_master_screen.dart';
import '../presentation/screens/user_master/add_user_screen.dart';
import '../presentation/screens/challan/challan_list_screen.dart';
import '../presentation/screens/bill/bill_list_screen.dart';
import '../presentation/screens/transaction/transaction_history_screen.dart';
import '../presentation/screens/party/party_master_screen.dart';
import '../presentation/screens/party/add_party_screen.dart';

class AppPages {
  AppPages._();

  static final pages = <GetPage>[
    GetPage(name: AppRoutes.splash, page: () => const SplashScreen()),
    GetPage(name: AppRoutes.login, page: () => const LoginScreen()),
    GetPage(
      name: AppRoutes.firmSelection,
      page: () => const FirmSelectionScreen(),
    ),
    GetPage(name: AppRoutes.home, page: () => const HomeScreen()),
    GetPage(name: AppRoutes.firmMaster, page: () => const FirmMasterScreen()),
    GetPage(name: AppRoutes.addFirm, page: () => const AddFirmScreen()),
    GetPage(name: AppRoutes.editFirm, page: () => const AddFirmScreen()),
    GetPage(name: AppRoutes.itemMaster, page: () => const ItemMasterScreen()),
    GetPage(name: AppRoutes.addItem, page: () => const AddItemScreen()),
    GetPage(name: AppRoutes.editItem, page: () => const AddItemScreen()),
    GetPage(
      name: AppRoutes.stockAlertMaster,
      page: () => const StockAlertScreen(),
    ),
    GetPage(name: AppRoutes.userMaster, page: () => const UserMasterScreen()),
    GetPage(name: AppRoutes.addUser, page: () => const AddUserScreen()),
    GetPage(name: AppRoutes.editUser, page: () => const AddUserScreen()),
    GetPage(name: AppRoutes.challanList, page: () => const ChallanListScreen()),
    GetPage(name: AppRoutes.billList, page: () => const BillListScreen()),
    GetPage(
      name: AppRoutes.transactionHistory,
      page: () => const TransactionHistoryScreen(),
    ),
    GetPage(name: AppRoutes.partyMaster, page: () => const PartyMasterScreen()),
    GetPage(name: AppRoutes.addParty, page: () => const AddPartyScreen()),
  ];
}
