import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/challan_model.dart';
import '../../data/models/item_model.dart';
import '../../data/models/party_model.dart';
import '../../data/services/api_service.dart';
import '../shared/widgets/common_widgets.dart';
import 'auth_controller.dart';

/// Represents one line-item row in the challan form.
class ChallanLineItem {
  ItemModel? item;
  final quantityC = TextEditingController(text: '1');
  final rateC = TextEditingController();
  final discountC = TextEditingController();

  /// 1 = GST, 0 = NON_GST.  Defaults to item master's is_gst.
  final RxInt isGst = 1.obs;

  // Auto-applied discount rule (from backend).
  double? autoDiscount; // percentage value resolved from Discount model
  String? autoDiscountLabel; // e.g. "5% (auto)" or "₹100 fixed (auto)"

  double get quantity => double.tryParse(quantityC.text) ?? 0;
  double get rate => double.tryParse(rateC.text) ?? 0;
  double get discount {
    final manual = double.tryParse(discountC.text);
    if (manual != null) return manual;
    return autoDiscount ?? 0;
  }

  bool get hasManualDiscount =>
      discountC.text.isNotEmpty && double.tryParse(discountC.text) != null;

  /// Whether the item's is_gst flag can be toggled by the user.
  /// Items with master is_gst=0 are locked to NON_GST only.
  bool get canToggleGst => item != null && item!.isGst == 1;

  double get grossAmount => quantity * rate;
  double get amount => grossAmount * (1 - discount / 100);

  void dispose() {
    quantityC.dispose();
    rateC.dispose();
    discountC.dispose();
  }
}

class CreateChallanController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final AuthController _auth = Get.find<AuthController>();

  final RxBool isLoading = false.obs;
  final RxBool isLoadingParties = true.obs;
  final RxBool isLoadingItems = true.obs;

  final RxList<PartyModel> parties = <PartyModel>[].obs;
  final RxList<ItemModel> items = <ItemModel>[].obs;
  final Rx<PartyModel?> selectedParty = Rx<PartyModel?>(null);
  final RxList<ChallanLineItem> lineItems = <ChallanLineItem>[].obs;

  // Challan-level discount
  final challanDiscountC = TextEditingController();
  double? autoPartyDiscount; // auto-resolved party discount %
  String? autoPartyDiscountLabel;

  // Reactively computed totals
  final RxDouble grossTotal = 0.0.obs;
  final RxDouble subTotal = 0.0.obs;
  final RxDouble challanDiscountAmount = 0.0.obs;
  final RxDouble finalAmount = 0.0.obs;

  // Edit mode
  ChallanModel? editChallan;
  bool get isEdit => editChallan != null;

  @override
  void onInit() {
    super.onInit();
    editChallan = Get.arguments as ChallanModel?;
    _loadData();
    // Add initial empty line
    if (!isEdit) addLineItem();
  }

  Future<void> _loadData() async {
    try {
      final firmId = _auth.firmId;
      final results = await Future.wait([
        _api.getParties(firmId),
        _api.getItems(),
      ]);
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
    // Set party
    selectedParty.value = parties.firstWhereOrNull((p) => p.id == c.partyId);
    // Set challan discount
    if (c.discount > 0) {
      challanDiscountC.text = c.discount.toStringAsFixed(2);
    }
    // Set line items
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

  /// Called when an item is selected for a line.
  Future<void> onItemSelected(int index, ItemModel? item) async {
    final line = lineItems[index];
    line.item = item;
    if (item != null) {
      line.rateC.text = item.amount.toStringAsFixed(2);
      // Default is_gst to the item master's flag
      line.isGst.value = item.isGst;
      // Fetch auto discount for this item
      await _resolveItemDiscount(index, item.id);
    }
    _recalculate();
  }

  /// Called when party changes — resolve party-level discount.
  Future<void> onPartySelected(PartyModel? party) async {
    selectedParty.value = party;
    autoPartyDiscount = null;
    autoPartyDiscountLabel = null;
    if (party != null) {
      final rule = await _api.getPartyDiscount(party.id);
      if (rule != null) {
        final p1 = (rule['percent1'] as num?)?.toDouble() ?? 0;
        final p2 = (rule['percent2'] as num?)?.toDouble() ?? 0;
        final fixed = (rule['fixed_amount'] as num?)?.toDouble() ?? 0;
        // Build label
        final parts = <String>[];
        if (p1 > 0) parts.add('${p1.toStringAsFixed(1)}%');
        if (p2 > 0) parts.add('+${p2.toStringAsFixed(1)}%');
        if (fixed > 0) parts.add('-₹${fixed.toStringAsFixed(0)}');
        if (parts.isNotEmpty) {
          autoPartyDiscountLabel = '${parts.join(' ')} (auto)';
          // Store combined effective % (approximation for challan-level).
          // Exact: price * (1 - p1/100) * (1 - p2/100) - fixed
          // For auto-display we store p1 as the primary %;
          // backend applies the full 3-column calc at save time.
          autoPartyDiscount = p1;
        }
      }
    }
    _recalculate();
  }

  Future<void> _resolveItemDiscount(int index, String itemId) async {
    final rule = await _api.getItemDiscount(itemId);
    final line = lineItems[index];
    if (rule != null) {
      final p1 = (rule['percent1'] as num?)?.toDouble() ?? 0;
      final p2 = (rule['percent2'] as num?)?.toDouble() ?? 0;
      final fixed = (rule['fixed_amount'] as num?)?.toDouble() ?? 0;

      if (p1 > 0 || p2 > 0 || fixed > 0) {
        // Build label
        final parts = <String>[];
        if (p1 > 0) parts.add('${p1.toStringAsFixed(1)}%');
        if (p2 > 0) parts.add('+${p2.toStringAsFixed(1)}%');
        if (fixed > 0) parts.add('-₹${fixed.toStringAsFixed(0)}');
        line.autoDiscountLabel = '${parts.join(' ')} (auto)';

        // Approximate effective discount % for the preview calculation.
        // Exact multi-column calc: price * (1 - p1/100) * (1 - p2/100) - fixed
        // We combine p1+p2 into a single effective % for UI display;
        // backend applies the precise 3-column calculation at save time.
        final rate = line.rate;
        if (rate > 0) {
          final afterPercents = rate * (1 - p1 / 100) * (1 - p2 / 100);
          final afterFixed = afterPercents - fixed;
          line.autoDiscount = ((rate - afterFixed) / rate) * 100;
        } else {
          line.autoDiscount = p1; // fallback
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

    // Challan-level discount
    double cd = double.tryParse(challanDiscountC.text) ?? 0;
    if (cd == 0 && autoPartyDiscount != null) {
      cd = autoPartyDiscount!;
    }
    challanDiscountAmount.value = sub * (cd / 100);
    finalAmount.value = sub - challanDiscountAmount.value;
  }

  void onFieldChanged() => _recalculate();

  Future<void> submit() async {
    // Validate
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
      final firmId = _auth.firmId;
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
          // Only send discount if user manually entered one.
          // Otherwise let backend auto-apply from Discount rules.
          if (l.hasManualDiscount) {
            map['discount'] = l.discount;
          }
          return map;
        }).toList(),
      };

      // Challan-level discount — only send if manually entered
      final cd = double.tryParse(challanDiscountC.text);
      if (cd != null && cd > 0) {
        data['discount'] = cd;
      }

      if (isEdit) {
        await _api.updateChallan(firmId, editChallan!.id, data);
        AppSnackbar.success('Challan updated');
      } else {
        await _api.createChallan(firmId, data);
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
