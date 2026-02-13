import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../data/models/item_model.dart';

class ChallanLineItem {
  ItemModel? item;
  final quantityC = TextEditingController(text: '1');
  final rateC = TextEditingController();
  final discountC = TextEditingController();

  final RxInt isGst = 1.obs;

  double? autoDiscount;
  String? autoDiscountLabel;

  double get quantity => double.tryParse(quantityC.text) ?? 0;
  double get rate => double.tryParse(rateC.text) ?? 0;
  double get discount {
    final manual = double.tryParse(discountC.text);
    if (manual != null) return manual;
    return autoDiscount ?? 0;
  }

  bool get hasManualDiscount =>
      discountC.text.isNotEmpty && double.tryParse(discountC.text) != null;

  bool get canToggleGst => item != null && item!.isGst == 1;

  double get grossAmount => quantity * rate;
  double get amount => grossAmount * (1 - discount / 100);

  void dispose() {
    quantityC.dispose();
    rateC.dispose();
    discountC.dispose();
  }
}
