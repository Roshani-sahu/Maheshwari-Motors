import 'package:get/get.dart';

import '../../../data/models/transaction_model.dart';
import '../../../data/services/api_service.dart';

class AccountMasterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<TransactionModel> transactions = <TransactionModel>[].obs;
  final RxList<TransactionModel> filteredTxns = <TransactionModel>[].obs;
  final RxString txnSearch = ''.obs;
  final RxString txnTypeFilter = 'all'.obs;
  final RxBool txnLoading = true.obs;
  final RxString txnError = ''.obs;
  final Rx<Map<String, dynamic>> summary = Rx<Map<String, dynamic>>({});

  @override
  void onInit() {
    super.onInit();
    loadTransactions();
    debounce(
      txnSearch,
      (_) => _filterTxns(),
      time: const Duration(milliseconds: 300),
    );
    ever(txnTypeFilter, (_) => _filterTxns());
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
}
