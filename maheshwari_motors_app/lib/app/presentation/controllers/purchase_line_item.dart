import 'package:flutter/material.dart';

import '../../data/models/item_model.dart';

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
