import 'package:get/get.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/discount_model.dart';
import '../../../data/models/transaction_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';

class AccountMasterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<TransactionModel> transactions = <TransactionModel>[].obs;
  final RxList<TransactionModel> filteredTxns = <TransactionModel>[].obs;
  final RxString txnSearch = ''.obs;
  final RxString txnTypeFilter = 'all'.obs;
  final RxBool txnLoading = true.obs;
  final RxString txnError = ''.obs;
  final Rx<Map<String, dynamic>> summary = Rx<Map<String, dynamic>>({});

  final RxList<DiscountModel> discounts = <DiscountModel>[].obs;
  final RxList<DiscountModel> filteredDiscounts = <DiscountModel>[].obs;
  final RxString discountTypeFilter = 'all'.obs;
  final RxBool discountLoading = true.obs;
  final RxString discountError = ''.obs;

  final RxInt tabIndex = 0.obs;

  @override
  void onInit() {
    super.onInit();
    loadTransactions();
    loadDiscounts();
    debounce(
      txnSearch,
      (_) => _filterTxns(),
      time: const Duration(milliseconds: 300),
    );
    ever(txnTypeFilter, (_) => _filterTxns());
    ever(discountTypeFilter, (_) => _filterDiscounts());
  }

  Future<void> loadTransactions() async {
    txnLoading.value = true;
    txnError.value = '';
    try {
      final results = await Future.wait([
        _api.getTransactions(),
        _api.getTransactionSummary(),
      ]);
      transactions.value = results[0] as List<TransactionModel>;
      summary.value = results[1] as Map<String, dynamic>;
      _filterTxns();
    } catch (e) {
      txnError.value = 'Failed to load transactions';
    }
    txnLoading.value = false;
  }

  void _filterTxns() {
    var list = transactions.toList();
    if (txnSearch.value.isNotEmpty) {
      final q = txnSearch.value.toLowerCase();
      list = list.where((t) {
        return (t.partyName?.toLowerCase().contains(q) ?? false) ||
            (t.utr?.toLowerCase().contains(q) ?? false) ||
            (t.transactionRef?.toLowerCase().contains(q) ?? false);
      }).toList();
    }
    if (txnTypeFilter.value != 'all') {
      list = list
          .where((t) => t.type.toLowerCase() == txnTypeFilter.value)
          .toList();
    }
    filteredTxns.value = list;
  }

  Future<void> loadDiscounts() async {
    discountLoading.value = true;
    discountError.value = '';
    try {
      discounts.value = await _api.getDiscounts();
      _filterDiscounts();
    } catch (e) {
      discountError.value = 'Failed to load discounts';
    }
    discountLoading.value = false;
  }

  void _filterDiscounts() {
    if (discountTypeFilter.value == 'all') {
      filteredDiscounts.value = discounts.toList();
    } else {
      filteredDiscounts.value = discounts
          .where((d) => d.type == discountTypeFilter.value)
          .toList();
    }
  }

  Future<void> deleteDiscount(String id) async {
    try {
      await _api.deleteDiscount(id);
      discounts.removeWhere((d) => d.id == id);
      _filterDiscounts();
      AppSnackbar.success('Discount removed');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}
