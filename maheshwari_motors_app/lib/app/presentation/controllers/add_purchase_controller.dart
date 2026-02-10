import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/item_model.dart';
import '../../data/models/supplier_model.dart';
import '../../data/services/api_service.dart';
import '../shared/widgets/common_widgets.dart';
import 'auth_controller.dart';

/// Represents one line-item row in the purchase form.
class PurchaseLineItem {
  ItemModel? item;
  final quantityC = TextEditingController(text: '1');
  final rateC = TextEditingController();

  double get quantity => double.tryParse(quantityC.text) ?? 0;
  double get rate => double.tryParse(rateC.text) ?? 0;
  double get amount => quantity * rate;

  void dispose() {
    quantityC.dispose();
    rateC.dispose();
  }
}

class AddPurchaseController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final AuthController _auth = Get.find<AuthController>();

  final RxBool isLoading = false.obs;
  final RxBool isLoadingData = true.obs;

  final RxList<SupplierModel> suppliers = <SupplierModel>[].obs;
  final RxList<ItemModel> items = <ItemModel>[].obs;
  final Rx<SupplierModel?> selectedSupplier = Rx<SupplierModel?>(null);
  final RxString purchaseType = 'GST'.obs;
  final RxList<PurchaseLineItem> lineItems = <PurchaseLineItem>[].obs;
  final RxDouble totalAmount = 0.0.obs;

  @override
  void onInit() {
    super.onInit();
    _loadData();
    addLineItem();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([_api.getSuppliers(), _api.getItems()]);
      suppliers.value = results[0] as List<SupplierModel>;
      items.value = results[1] as List<ItemModel>;
    } catch (e) {
      AppSnackbar.error('Failed to load data');
    }
    isLoadingData.value = false;
  }

  void addLineItem() {
    lineItems.add(PurchaseLineItem());
  }

  void removeLineItem(int index) {
    if (lineItems.length > 1) {
      lineItems[index].dispose();
      lineItems.removeAt(index);
      recalculate();
    }
  }

  void onItemSelected(int index, ItemModel? item) {
    final line = lineItems[index];
    line.item = item;
    if (item != null) {
      line.rateC.text = item.amount.toStringAsFixed(2);
    }
    recalculate();
  }

  void recalculate() {
    double total = 0;
    for (final line in lineItems) {
      total += line.amount;
    }
    totalAmount.value = total;
  }

  Future<void> submit() async {
    if (selectedSupplier.value == null) {
      AppSnackbar.error('Please select a supplier');
      return;
    }
    final validLines = lineItems.where((l) => l.item != null && l.quantity > 0);
    if (validLines.isEmpty) {
      AppSnackbar.error('Add at least one item');
      return;
    }

    isLoading.value = true;
    try {
      final data = <String, dynamic>{
        'supplier_id': selectedSupplier.value!.id,
        'purchase_type': purchaseType.value,
        'date': DateTime.now().toIso8601String(),
        'items': validLines
            .map(
              (l) => {
                'item_id': l.item!.id,
                'quantity': l.quantity,
                'rate': l.rate,
              },
            )
            .toList(),
      };
      await _api.createPurchase(_auth.firmId, data);
      AppSnackbar.success('Purchase recorded');
      Get.back(result: true);
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
    isLoading.value = false;
  }

  @override
  void onClose() {
    for (final l in lineItems) {
      l.dispose();
    }
    super.onClose();
  }
}
