import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/challan_model.dart';
import '../../../data/models/discount_model.dart';
import '../../../data/models/item_model.dart';
import '../../../data/models/party_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';
import 'challan_line_item.dart';

class CreateChallanController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxBool isLoading = false.obs;
  final RxBool isLoadingParties = true.obs;
  final RxBool isLoadingItems = true.obs;

  final RxList<PartyModel> parties = <PartyModel>[].obs;
  final RxList<ItemModel> items = <ItemModel>[].obs;
  final RxList<DiscountModel> discounts = <DiscountModel>[].obs;
  final Rx<PartyModel?> selectedParty = Rx<PartyModel?>(null);
  final RxList<ChallanLineItem> lineItems = <ChallanLineItem>[].obs;

  final challanDiscountC = TextEditingController();

  final RxDouble grossTotal = 0.0.obs;
  final RxDouble subTotal = 0.0.obs;
  final RxDouble challanDiscountAmount = 0.0.obs;
  final RxDouble finalAmount = 0.0.obs;

  ChallanModel? editChallan;
  bool get isEdit => editChallan != null;

  @override
  void onInit() {
    super.onInit();
    editChallan = Get.arguments as ChallanModel?;
    _loadData();
    if (!isEdit) addLineItem();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        _api.getParties(),
        _api.getItems(),
        _api.getDiscounts(),
      ]);
      parties.value = results[0] as List<PartyModel>;
      items.value = results[1] as List<ItemModel>;
      discounts.value = results[2] as List<DiscountModel>;

      if (isEdit) _populateEditData();
    } catch (e) {
      AppSnackbar.error('Failed to load data');
    }
    isLoadingParties.value = false;
    isLoadingItems.value = false;
  }

  void _populateEditData() {
    final c = editChallan!;
    selectedParty.value = parties.firstWhereOrNull((p) => p.id == c.partyId);
    if (c.discount > 0) {
      challanDiscountC.text = c.discount.toStringAsFixed(2);
    }
    for (final ci in c.items) {
      final line = ChallanLineItem();
      line.item = items.firstWhereOrNull((i) => i.id == ci.itemId);
      line.quantityC.text = ci.quantity.toString();
      line.rateC.text = ci.rate.toStringAsFixed(2);
      line.isGst.value = ci.isGst;
      if (ci.discount > 0) {
        line.discountC.text = ci.discount.toStringAsFixed(2);
      }
      _applyBrandDiscount(line);
      lineItems.add(line);
    }
    _recalculate();
  }

  void addLineItem() {
    lineItems.add(ChallanLineItem());
  }

  void removeLineItem(int index) {
    if (lineItems.length > 1) {
      lineItems[index].dispose();
      lineItems.removeAt(index);
      _recalculate();
    }
  }

  void _applyBrandDiscount(ChallanLineItem line) {
    if (line.item == null || line.item!.brandId == null) {
      line.brandGstDiscount = 0;
      line.brandNonGstDiscount = 0;
      return;
    }
    final discount = discounts.firstWhereOrNull(
      (d) => d.brandId == line.item!.brandId,
    );
    if (discount != null) {
      line.brandGstDiscount = discount.discount1.total;
      line.brandNonGstDiscount = discount.discount2.total;
    } else {
      line.brandGstDiscount = 0;
      line.brandNonGstDiscount = 0;
    }
  }

  void onItemSelected(int index, ItemModel? item) {
    final line = lineItems[index];
    line.item = item;
    if (item != null) {
      line.rateC.text = item.saleRate.toStringAsFixed(2);
      line.isGst.value = item.isGst;
      _applyBrandDiscount(line);
    }
    lineItems.refresh();
    _recalculate();
  }

  void onPartySelected(PartyModel? party) {
    selectedParty.value = party;
    _recalculate();
  }

  void onGstToggled(int index, int value) {
    lineItems[index].isGst.value = value;
    lineItems.refresh();
    _recalculate();
  }

  void _recalculate() {
    double gross = 0;
    double sub = 0;
    for (final line in lineItems) {
      gross += line.grossAmount;
      sub += line.amount;
    }
    grossTotal.value = gross;
    subTotal.value = sub;

    final cd = double.tryParse(challanDiscountC.text) ?? 0;
    challanDiscountAmount.value = sub * (cd / 100);
    finalAmount.value = sub - challanDiscountAmount.value;
  }

  void onFieldChanged() => _recalculate();

  Future<void> submit() async {
    if (selectedParty.value == null) {
      AppSnackbar.error('Please select a party');
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
        'party_id': selectedParty.value!.id,
        'date': DateTime.now().toIso8601String(),
        'items': validLines.map((l) {
          return <String, dynamic>{
            'item_id': l.item!.id,
            'quantity': l.quantity,
            'rate': l.rate,
            'is_gst': l.isGst.value,
            'discount': l.discount,
          };
        }).toList(),
      };

      final cd = double.tryParse(challanDiscountC.text);
      if (cd != null && cd > 0) {
        data['discount'] = cd;
      }

      if (isEdit) {
        await _api.updateChallan(editChallan!.id, data);
        AppSnackbar.success('Challan updated');
      } else {
        await _api.createChallan(data);
        AppSnackbar.success('Challan created');
      }
      Get.back(result: true);
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
    isLoading.value = false;
  }

  @override
  void onClose() {
    challanDiscountC.dispose();
    for (final l in lineItems) {
      l.dispose();
    }
    super.onClose();
  }
}
