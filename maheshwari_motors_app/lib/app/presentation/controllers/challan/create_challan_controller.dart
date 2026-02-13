import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/challan_model.dart';
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
  final Rx<PartyModel?> selectedParty = Rx<PartyModel?>(null);
  final RxList<ChallanLineItem> lineItems = <ChallanLineItem>[].obs;

  final challanDiscountC = TextEditingController();
  double? autoPartyDiscount;
  String? autoPartyDiscountLabel;

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
      final results = await Future.wait([_api.getParties(), _api.getItems()]);
      parties.value = results[0] as List<PartyModel>;
      items.value = results[1] as List<ItemModel>;

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

  Future<void> onItemSelected(int index, ItemModel? item) async {
    final line = lineItems[index];
    line.item = item;
    if (item != null) {
      line.rateC.text = item.amount.toStringAsFixed(2);
      line.isGst.value = item.isGst;
      await _resolveItemDiscount(index, item.id);
    }
    _recalculate();
  }

  Future<void> onPartySelected(PartyModel? party) async {
    selectedParty.value = party;
    autoPartyDiscount = null;
    autoPartyDiscountLabel = null;
    if (party != null) {
      final rules = await _api.getPartyDiscount(party.id);
      if (rules.isNotEmpty) {
        final rule = rules.first;
        final p1 = (rule['percent1'] as num?)?.toDouble() ?? 0;
        final p2 = (rule['percent2'] as num?)?.toDouble() ?? 0;
        final fixed = (rule['fixed_amount'] as num?)?.toDouble() ?? 0;
        final parts = <String>[];
        if (p1 > 0) parts.add('${p1.toStringAsFixed(1)}%');
        if (p2 > 0) parts.add('+${p2.toStringAsFixed(1)}%');
        if (fixed > 0) parts.add('-₹${fixed.toStringAsFixed(0)}');
        if (parts.isNotEmpty) {
          autoPartyDiscountLabel = '${parts.join(' ')} (auto)';
          autoPartyDiscount = p1;
        }
      }
    }
    _recalculate();
  }

  Future<void> _resolveItemDiscount(int index, String itemId) async {
    final rules = await _api.getItemDiscount(itemId);
    final line = lineItems[index];
    if (rules.isNotEmpty) {
      final rule = rules.first;
      final p1 = (rule['percent1'] as num?)?.toDouble() ?? 0;
      final p2 = (rule['percent2'] as num?)?.toDouble() ?? 0;
      final fixed = (rule['fixed_amount'] as num?)?.toDouble() ?? 0;

      if (p1 > 0 || p2 > 0 || fixed > 0) {
        final parts = <String>[];
        if (p1 > 0) parts.add('${p1.toStringAsFixed(1)}%');
        if (p2 > 0) parts.add('+${p2.toStringAsFixed(1)}%');
        if (fixed > 0) parts.add('-₹${fixed.toStringAsFixed(0)}');
        line.autoDiscountLabel = '${parts.join(' ')} (auto)';

        final rate = line.rate;
        if (rate > 0) {
          final afterPercents = rate * (1 - p1 / 100) * (1 - p2 / 100);
          final afterFixed = afterPercents - fixed;
          line.autoDiscount = ((rate - afterFixed) / rate) * 100;
        } else {
          line.autoDiscount = p1;
        }
      } else {
        line.autoDiscount = null;
        line.autoDiscountLabel = null;
      }
    } else {
      line.autoDiscount = null;
      line.autoDiscountLabel = null;
    }
    lineItems.refresh();
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

    double cd = double.tryParse(challanDiscountC.text) ?? 0;
    if (cd == 0 && autoPartyDiscount != null) {
      cd = autoPartyDiscount!;
    }
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
          final map = <String, dynamic>{
            'item_id': l.item!.id,
            'quantity': l.quantity,
            'rate': l.rate,
            'is_gst': l.isGst.value,
          };
          if (l.hasManualDiscount) {
            map['discount'] = l.discount;
          }
          return map;
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
