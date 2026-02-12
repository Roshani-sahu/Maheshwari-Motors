class ChallanItemModel {
  final String? itemId;
  final String? itemName;
  final int quantity;
  final double rate;
  final double discount;
  final double grossAmount;
  final double amount;
  final int isGst;

  ChallanItemModel({
    this.itemId,
    this.itemName,
    required this.quantity,
    required this.rate,
    this.discount = 0,
    required this.grossAmount,
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
      grossAmount: (json['gross_amount'] ?? 0).toDouble(),
      amount: (json['amount'] ?? 0).toDouble(),
      isGst: json['is_gst'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
    'item_id': itemId,
    'quantity': quantity,
    'rate': rate,
    'discount': discount,
    'gross_amount': grossAmount,
    'amount': amount,
    'is_gst': isGst,
  };
}

class ChallanModel {
  final String id;
  final String challanNo;
  final DateTime date;
  final String? partyId;
  final String? partyName;
  final List<ChallanItemModel> items;
  final double grossTotal;
  final double subTotal;
  final double amount;
  final double discount;
  final bool convertedToBill;
  final String? billId;
  final int isGst;
  final String? linkedChallanId;

  ChallanModel({
    required this.id,
    required this.challanNo,
    required this.date,
    this.partyId,
    this.partyName,
    this.items = const [],
    this.grossTotal = 0,
    this.subTotal = 0,
    required this.amount,
    this.discount = 0,
    this.convertedToBill = false,
    this.billId,
    this.isGst = 1,
    this.linkedChallanId,
  });

  factory ChallanModel.fromJson(Map<String, dynamic> json) {
    final partyData = json['party_id'];
    return ChallanModel(
      id: json['_id'] ?? '',
      challanNo: json['challan_no'] ?? '',
      date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
      partyId: partyData is Map ? partyData['_id'] : partyData?.toString(),
      partyName: partyData is Map ? partyData['name'] : null,
      items: json['items'] != null
          ? (json['items'] as List)
                .map((e) => ChallanItemModel.fromJson(e))
                .toList()
          : [],
      grossTotal: (json['gross_total'] ?? 0).toDouble(),
      subTotal: (json['sub_total'] ?? 0).toDouble(),
      amount: (json['amount'] ?? 0).toDouble(),
      discount: (json['discount'] ?? 0).toDouble(),
      convertedToBill: json['converted_to_bill'] ?? false,
      billId: json['bill_id']?.toString(),
      isGst: json['is_gst'] ?? 1,
      linkedChallanId: json['linked_challan_id']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      '_id': id,
      'challan_no': challanNo,
      'date': date.toIso8601String(),
      'items': items.map((e) => e.toJson()).toList(),
      'gross_total': grossTotal,
      'sub_total': subTotal,
      'amount': amount,
      'discount': discount,
      'converted_to_bill': convertedToBill,
      'is_gst': isGst,
    };
    if (partyId != null) map['party_id'] = partyId;
    if (billId != null) map['bill_id'] = billId;
    if (linkedChallanId != null) map['linked_challan_id'] = linkedChallanId;
    return map;
  }
}
