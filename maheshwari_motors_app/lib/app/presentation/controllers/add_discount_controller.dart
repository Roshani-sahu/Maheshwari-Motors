import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/discount_model.dart';
import '../../data/models/item_model.dart';
import '../../data/models/party_model.dart';
import '../../data/services/api_service.dart';
import '../shared/widgets/common_widgets.dart';

class AddDiscountController extends GetxController {
  final formKey = GlobalKey<FormState>();
  final percent1C = TextEditingController();
  final percent2C = TextEditingController();
  final fixedAmountC = TextEditingController();
  final profitPercentC = TextEditingController();
  final itemGroupNameC = TextEditingController();

  final ApiService _api = Get.find<ApiService>();
  final RxBool isLoading = false.obs;
  final RxBool isLoadingData = true.obs;

  final RxString type = 'item'.obs;
  final Rx<String?> selectedItemId = Rx<String?>(null);
  final Rx<String?> selectedPartyId = Rx<String?>(null);
  final RxList<String> selectedItemIds = <String>[].obs;

  final RxList<ItemModel> items = <ItemModel>[].obs;
  final RxList<PartyModel> parties = <PartyModel>[].obs;

  DiscountModel? editDiscount;
  bool get isEdit => editDiscount != null;

  bool get needsItem =>
      type.value == 'item' ||
      type.value == 'party_item' ||
      type.value == 'profit_margin';

  bool get needsParty =>
      type.value == 'party_item' || type.value == 'party_all';

  bool get needsItemGroup => type.value == 'item_group';

  bool get needsProfitPercent => type.value == 'profit_margin';

  @override
  void onInit() {
    super.onInit();
    editDiscount = Get.arguments as DiscountModel?;
    _loadData();
    if (editDiscount != null) {
      final d = editDiscount!;
      type.value = d.type;
      if (d.percent1 > 0) percent1C.text = d.percent1.toStringAsFixed(1);
      if (d.percent2 > 0) percent2C.text = d.percent2.toStringAsFixed(1);
      if (d.fixedAmount > 0) {
        fixedAmountC.text = d.fixedAmount.toStringAsFixed(0);
      }
      if (d.profitPercent > 0) {
        profitPercentC.text = d.profitPercent.toStringAsFixed(1);
      }
      if (d.itemGroupName != null) {
        itemGroupNameC.text = d.itemGroupName!;
      }
      selectedItemId.value = d.itemId;
      selectedPartyId.value = d.partyId;
      selectedItemIds.assignAll(d.itemIds);
    }
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([_api.getItems(), _api.getParties()]);
      items.value = results[0] as List<ItemModel>;
      parties.value = results[1] as List<PartyModel>;
    } catch (e) {
      AppSnackbar.error('Failed to load data');
    }
    isLoadingData.value = false;
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;

    if (!isEdit) {
      if (needsItem && selectedItemId.value == null) {
        AppSnackbar.error('Please select an item');
        return;
      }
      if (needsParty && selectedPartyId.value == null) {
        AppSnackbar.error('Please select a party');
        return;
      }
      if (needsItemGroup && itemGroupNameC.text.trim().isEmpty) {
        AppSnackbar.error('Please enter an item group name');
        return;
      }
    }

    isLoading.value = true;
    try {
      final data = <String, dynamic>{};

      final p1 = double.tryParse(percent1C.text.trim()) ?? 0;
      final p2 = double.tryParse(percent2C.text.trim()) ?? 0;
      final fa = double.tryParse(fixedAmountC.text.trim()) ?? 0;
      final pp = double.tryParse(profitPercentC.text.trim()) ?? 0;

      if (p1 > 0) data['percent1'] = p1;
      if (p2 > 0) data['percent2'] = p2;
      if (fa > 0) data['fixed_amount'] = fa;
      if (pp > 0) data['profit_percent'] = pp;

      if (isEdit) {
        await _api.updateDiscount(editDiscount!.id, data);
        AppSnackbar.success('Discount rule updated');
      } else {
        data['type'] = type.value;
        if (needsItem) data['item_id'] = selectedItemId.value;
        if (needsParty) data['party_id'] = selectedPartyId.value;
        if (needsItemGroup) {
          data['item_group_name'] = itemGroupNameC.text.trim();
          if (selectedItemIds.isNotEmpty) {
            data['item_ids'] = selectedItemIds.toList();
          }
        }
        await _api.createDiscount(data);
        AppSnackbar.success('Discount rule created');
      }
      Get.back(result: true);
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
    isLoading.value = false;
  }

  @override
  void onClose() {
    percent1C.dispose();
    percent2C.dispose();
    fixedAmountC.dispose();
    profitPercentC.dispose();
    itemGroupNameC.dispose();
    super.onClose();
  }
}
