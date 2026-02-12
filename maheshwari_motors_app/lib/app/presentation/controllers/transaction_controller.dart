import 'package:get/get.dart';

import '../../data/models/transaction_model.dart';
import '../../data/services/api_service.dart';

class TransactionHistoryController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<TransactionModel> transactions = <TransactionModel>[].obs;
  final RxList<TransactionModel> filtered = <TransactionModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString typeFilter = 'all'.obs;
  final RxMap<String, dynamic> summary = <String, dynamic>{}.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadData();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
    ever(typeFilter, (_) => _filter());
  }

  Future<void> loadData() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final results = await Future.wait([
        _api.getTransactions(),
        _api.getTransactionSummary(),
      ]);
      transactions.value = results[0] as List<TransactionModel>;
      summary.value = results[1] as Map<String, dynamic>;
      _filter();
    } catch (e) {
      errorMessage.value = 'Failed to load transactions';
      transactions.clear();
      summary.clear();
      filtered.clear();
    }
    isLoading.value = false;
  }

  void _filter() {
    var list = transactions.toList();
    if (searchQuery.value.isNotEmpty) {
      final q = searchQuery.value.toLowerCase();
      list = list.where((t) {
        final party = t.partyName?.toLowerCase() ?? '';
        final type = t.type.toLowerCase();
        return party.contains(q) || type.contains(q);
      }).toList();
    }
    if (typeFilter.value != 'all') {
      list = list
          .where((t) => t.type.toLowerCase() == typeFilter.value.toLowerCase())
          .toList();
    }
    filtered.value = list;
  }
}
