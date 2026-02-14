class ChallanItemModel {
  final String? itemId;
  final String? itemName;
  final int quantity;
  final double rate;
  final double discount;
  final double specialDiscount;
  final double grossAmount;
  final double discountAmount;
  final double taxableAmount;
  final double gstPercent;
  final double gstAmount;
  final double amount;
  final int isGst;

  ChallanItemModel({
    this.itemId,
    this.itemName,
    required this.quantity,
    required this.rate,
    this.discount = 0,
    this.specialDiscount = 0,
    required this.grossAmount,
    this.discountAmount = 0,
    this.taxableAmount = 0,
    this.gstPercent = 0,
    this.gstAmount = 0,
    required this.amount,
    this.isGst = 1,
  });

  factory ChallanItemModel.fromJson(Map<String, dynamic> json) {
    final itemId = json['item_id'];
    return ChallanItemModel(
      itemId: itemId is Map ? itemId['_id'] : itemId?.toString(),
      itemName: itemId is Map ? itemId['item_name'] : null,
      quantity: json['quantity'] ?? 0,
      rate: (json['rate'] ?? 0).toDouble(),
      discount: (json['discount'] ?? 0).toDouble(),
      specialDiscount: (json['special_discount'] ?? 0).toDouble(),
      grossAmount: (json['gross_amount'] ?? 0).toDouble(),
      discountAmount: (json['discount_amount'] ?? 0).toDouble(),
      taxableAmount: (json['taxable_amount'] ?? 0).toDouble(),
      gstPercent: (json['gst_percent'] ?? 0).toDouble(),
      gstAmount: (json['gst_amount'] ?? 0).toDouble(),
      amount: (json['amount'] ?? 0).toDouble(),
      isGst: json['is_gst'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
    'item_id': itemId,
    'quantity': quantity,
    'rate': rate,
    'discount': discount,
    'special_discount': specialDiscount,
    'gross_amount': grossAmount,
    'discount_amount': discountAmount,
    'taxable_amount': taxableAmount,
    'gst_percent': gstPercent,
    'gst_amount': gstAmount,
    'amount': amount,
    'is_gst': isGst,
  };
}
