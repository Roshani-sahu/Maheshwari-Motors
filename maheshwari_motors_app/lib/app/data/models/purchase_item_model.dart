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
