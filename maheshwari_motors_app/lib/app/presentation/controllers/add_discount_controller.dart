import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/discount_model.dart';
import '../../data/models/item_model.dart';
import '../../data/models/party_model.dart';
import '../../data/services/api_service.dart';
import '../shared/widgets/common_widgets.dart';
import 'auth_controller.dart';

class AddDiscountController extends GetxController {
  final formKey = GlobalKey<FormState>();
  final valueC = TextEditingController();

  final ApiService _api = Get.find<ApiService>();
  final AuthController _auth = Get.find<AuthController>();
  final RxBool isLoading = false.obs;
  final RxBool isLoadingData = true.obs;

  final RxString type = 'item'.obs;
  final RxString discountType = 'percentage'.obs;
  final Rx<String?> selectedTargetId = Rx<String?>(null);

  final RxList<ItemModel> items = <ItemModel>[].obs;
  final RxList<PartyModel> parties = <PartyModel>[].obs;

  DiscountModel? editDiscount;
  bool get isEdit => editDiscount != null;

  @override
  void onInit() {
    super.onInit();
    editDiscount = Get.arguments as DiscountModel?;
    _loadData();
    if (editDiscount != null) {
      type.value = editDiscount!.type;
      discountType.value = editDiscount!.discountType;
      valueC.text = editDiscount!.value.toStringAsFixed(
        editDiscount!.discountType == 'fixed' ? 0 : 1,
      );
      selectedTargetId.value = editDiscount!.type == 'item'
          ? editDiscount!.itemId
          : editDiscount!.partyId;
    }
  }

  Future<void> _loadData() async {
    try {
      final firmId = _auth.firmId;
      final results = await Future.wait([
        _api.getItems(),
        _api.getParties(firmId),
      ]);
      items.value = results[0] as List<ItemModel>;
      parties.value = results[1] as List<PartyModel>;
    } catch (e) {
      AppSnackbar.error('Failed to load data');
    }
    isLoadingData.value = false;
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    if (!isEdit && selectedTargetId.value == null) {
      AppSnackbar.error(
        type.value == 'item'
            ? 'Please select an item'
            : 'Please select a party',
      );
      return;
    }

    isLoading.value = true;
    try {
      final data = <String, dynamic>{
        'discount_type': discountType.value,
        'value': double.parse(valueC.text.trim()),
      };

      if (isEdit) {
        await _api.updateDiscount(editDiscount!.id, data);
        AppSnackbar.success('Discount rule updated');
      } else {
        data['type'] = type.value;
        if (type.value == 'item') {
          data['item_id'] = selectedTargetId.value;
        } else {
          data['party_id'] = selectedTargetId.value;
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
    valueC.dispose();
    super.onClose();
  }
}
