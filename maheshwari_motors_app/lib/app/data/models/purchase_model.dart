class PurchaseItemModel {
  final String? itemId;
  final String? itemName;
  final int quantity;
  final double rate;
  final double amount;

  PurchaseItemModel({
    this.itemId,
    this.itemName,
    required this.quantity,
    required this.rate,
    required this.amount,
  });

  factory PurchaseItemModel.fromJson(Map<String, dynamic> json) {
    final itemId = json['item_id'];
    return PurchaseItemModel(
      itemId: itemId is Map ? itemId['_id'] : itemId?.toString(),
      itemName: itemId is Map ? itemId['item_name'] : null,
      quantity: json['quantity'] ?? 0,
      rate: (json['rate'] ?? 0).toDouble(),
      amount: (json['amount'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    'item_id': itemId,
    'quantity': quantity,
    'rate': rate,
  };
}

class PurchaseModel {
  final String id;
  final String purchaseNo;
  final String? supplierId;
  final String? supplierName;
  final DateTime date;
  final List<PurchaseItemModel> items;
  final String purchaseType;
  final double amount;
  final String paymentStatus;
  final double paidAmount;
  final String firmId;

  PurchaseModel({
    required this.id,
    required this.purchaseNo,
    this.supplierId,
    this.supplierName,
    required this.date,
    this.items = const [],
    required this.purchaseType,
    required this.amount,
    this.paymentStatus = 'due',
    this.paidAmount = 0,
    required this.firmId,
  });

  double get balanceAmount => amount - paidAmount;

  factory PurchaseModel.fromJson(Map<String, dynamic> json) {
    final supplier = json['supplier_id'];
    return PurchaseModel(
      id: json['_id'] ?? '',
      purchaseNo: json['purchase_no'] ?? '',
      supplierId: supplier is Map ? supplier['_id'] : supplier?.toString(),
      supplierName: supplier is Map ? supplier['name'] : null,
      date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
      items: json['items'] != null
          ? (json['items'] as List)
                .map((e) => PurchaseItemModel.fromJson(e))
                .toList()
          : [],
      purchaseType: json['purchase_type'] ?? 'GST',
      amount: (json['amount'] ?? 0).toDouble(),
      paymentStatus: json['payment_status'] ?? 'due',
      paidAmount: (json['paid_amount'] ?? 0).toDouble(),
      firmId: json['firm_id'] is Map
          ? json['firm_id']['_id'] ?? ''
          : json['firm_id'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      '_id': id,
      'purchase_no': purchaseNo,
      'date': date.toIso8601String(),
      'items': items.map((e) => e.toJson()).toList(),
      'purchase_type': purchaseType,
      'amount': amount,
      'payment_status': paymentStatus,
      'paid_amount': paidAmount,
      'firm_id': firmId,
    };
    if (supplierId != null) map['supplier_id'] = supplierId;
    return map;
  }
}
