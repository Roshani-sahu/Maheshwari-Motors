import 'package:get/get.dart';

import '../routes/app_routes.dart';
import '../presentation/controllers/add_firm_controller.dart';
import '../presentation/controllers/add_item_controller.dart';
import '../presentation/controllers/add_party_controller.dart';
import '../presentation/controllers/add_user_controller.dart';
import '../presentation/screens/splash/splash_screen.dart';
import '../presentation/screens/auth/login/login_screen.dart';
import '../presentation/screens/firm_selection/firm_selection_screen.dart';
import '../presentation/screens/home/home_screen.dart';
import '../presentation/screens/firm_master/firm_master_screen.dart';
import '../presentation/screens/firm_master/add_firm_screen.dart';
import '../presentation/screens/item_master/item_master_screen.dart';
import '../presentation/screens/item_master/item_view_screen.dart';
import '../presentation/screens/item_master/add_item_screen.dart';
import '../presentation/screens/stock_alert/stock_alert_screen.dart';
import '../presentation/screens/user_master/user_master_screen.dart';
import '../presentation/screens/user_master/add_user_screen.dart';
import '../presentation/screens/challan/challan_list_screen.dart';
import '../presentation/screens/challan/create_challan_screen.dart';
import '../presentation/screens/bill/bill_list_screen.dart';
import '../presentation/screens/bill/generate_bill_screen.dart';
import '../presentation/screens/transaction/transaction_history_screen.dart';
import '../presentation/screens/party/party_master_screen.dart';
import '../presentation/screens/party/add_party_screen.dart';
import '../presentation/screens/auth/change_password_screen.dart';
import '../presentation/controllers/change_password_controller.dart';
import '../presentation/screens/category_master/category_master_screen.dart';
import '../presentation/screens/category_master/view_category_screen.dart';
import '../presentation/screens/category_master/add_category_screen.dart';
import '../presentation/screens/supplier_master/supplier_master_screen.dart';
import '../presentation/screens/supplier_master/view_supplier_screen.dart';
import '../presentation/screens/supplier_master/add_supplier_screen.dart';
import '../presentation/controllers/add_category_controller.dart';
import '../presentation/controllers/add_supplier_controller.dart';
import '../presentation/controllers/create_challan_controller.dart';
import '../presentation/controllers/generate_bill_controller.dart';
import '../presentation/controllers/purchase_controller.dart';
import '../presentation/controllers/add_purchase_controller.dart';
import '../presentation/controllers/discount_controller.dart';
import '../presentation/controllers/add_discount_controller.dart';
import '../presentation/controllers/account_master_controller.dart';
import '../presentation/screens/purchase/purchase_master_screen.dart';
import '../presentation/screens/purchase/add_purchase_screen.dart';
import '../presentation/screens/discount/discount_master_screen.dart';
import '../presentation/screens/discount/add_discount_screen.dart';
import '../presentation/screens/account_master/account_master_screen.dart';
import '../presentation/screens/reports/report_screen.dart';
import '../presentation/screens/help/help_support_screen.dart';

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
    GetPage(
      name: AppRoutes.addFirm,
      page: () => const AddFirmScreen(),
      binding: BindingsBuilder(() => Get.lazyPut(() => AddFirmController())),
    ),
    GetPage(
      name: AppRoutes.editFirm,
      page: () => const AddFirmScreen(),
      binding: BindingsBuilder(() => Get.lazyPut(() => AddFirmController())),
    ),
    GetPage(name: AppRoutes.itemMaster, page: () => const ItemMasterScreen()),
    GetPage(name: AppRoutes.itemView, page: () => const ItemViewScreen()),
    GetPage(
      name: AppRoutes.addItem,
      page: () => const AddItemScreen(),
      binding: BindingsBuilder(() => Get.lazyPut(() => AddItemController())),
    ),
    GetPage(
      name: AppRoutes.editItem,
      page: () => const AddItemScreen(),
      binding: BindingsBuilder(() => Get.lazyPut(() => AddItemController())),
    ),
    GetPage(
      name: AppRoutes.stockAlertMaster,
      page: () => const StockAlertScreen(),
    ),
    GetPage(name: AppRoutes.userMaster, page: () => const UserMasterScreen()),
    GetPage(
      name: AppRoutes.addUser,
      page: () => const AddUserScreen(),
      binding: BindingsBuilder(() => Get.lazyPut(() => AddUserController())),
    ),
    GetPage(
      name: AppRoutes.editUser,
      page: () => const AddUserScreen(),
      binding: BindingsBuilder(() => Get.lazyPut(() => AddUserController())),
    ),
    GetPage(name: AppRoutes.challanList, page: () => const ChallanListScreen()),
    GetPage(
      name: AppRoutes.createChallan,
      page: () => const CreateChallanScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => CreateChallanController()),
      ),
    ),
    GetPage(
      name: AppRoutes.editChallan,
      page: () => const CreateChallanScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => CreateChallanController()),
      ),
    ),
    GetPage(name: AppRoutes.billList, page: () => const BillListScreen()),
    GetPage(
      name: AppRoutes.generateBill,
      page: () => const GenerateBillScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => GenerateBillController()),
      ),
    ),
    GetPage(
      name: AppRoutes.transactionHistory,
      page: () => const TransactionHistoryScreen(),
    ),
    GetPage(name: AppRoutes.partyMaster, page: () => const PartyMasterScreen()),
    GetPage(
      name: AppRoutes.addParty,
      page: () => const AddPartyScreen(),
      binding: BindingsBuilder(() => Get.lazyPut(() => AddPartyController())),
    ),
    GetPage(
      name: AppRoutes.editParty,
      page: () => const AddPartyScreen(),
      binding: BindingsBuilder(() => Get.lazyPut(() => AddPartyController())),
    ),
    GetPage(
      name: AppRoutes.changePassword,
      page: () => const ChangePasswordScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => ChangePasswordController()),
      ),
    ),
    GetPage(
      name: AppRoutes.categoryMaster,
      page: () => const CategoryMasterScreen(),
    ),
    GetPage(
      name: AppRoutes.viewCategory,
      page: () => const ViewCategoryScreen(),
    ),
    GetPage(
      name: AppRoutes.addCategory,
      page: () => const AddCategoryScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => AddCategoryController()),
      ),
    ),
    GetPage(
      name: AppRoutes.editCategory,
      page: () => const AddCategoryScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => AddCategoryController()),
      ),
    ),
    GetPage(
      name: AppRoutes.supplierMaster,
      page: () => const SupplierMasterScreen(),
    ),
    GetPage(
      name: AppRoutes.viewAllSupplier,
      page: () => const ViewSupplierScreen(),
    ),
    GetPage(
      name: AppRoutes.addSupplier,
      page: () => const AddSupplierScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => AddSupplierController()),
      ),
    ),
    GetPage(
      name: AppRoutes.editSupplier,
      page: () => const AddSupplierScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => AddSupplierController()),
      ),
    ),
    GetPage(
      name: AppRoutes.purchaseMaster,
      page: () => const PurchaseMasterScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => PurchaseMasterController()),
      ),
    ),
    GetPage(
      name: AppRoutes.addPurchase,
      page: () => const AddPurchaseScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => AddPurchaseController()),
      ),
    ),
    GetPage(
      name: AppRoutes.discountMaster,
      page: () => const DiscountMasterScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => DiscountMasterController()),
      ),
    ),
    GetPage(
      name: AppRoutes.addDiscount,
      page: () => const AddDiscountScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => AddDiscountController()),
      ),
    ),
    GetPage(
      name: AppRoutes.editDiscount,
      page: () => const AddDiscountScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => AddDiscountController()),
      ),
    ),
    GetPage(
      name: AppRoutes.accountMaster,
      page: () => const AccountMasterScreen(),
      binding: BindingsBuilder(
        () => Get.lazyPut(() => AccountMasterController()),
      ),
    ),
    GetPage(name: AppRoutes.report, page: () => const ReportScreen()),
    GetPage(name: AppRoutes.helpSupport, page: () => const HelpSupportScreen()),
  ];
}
