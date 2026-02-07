class ChallanItemModel {
  final String? itemId;
  final String? itemName;
  final int quantity;
  final double rate;
  final double discount;
  final double grossAmount;
  final double amount;

  ChallanItemModel({
    this.itemId,
    this.itemName,
    required this.quantity,
    required this.rate,
    this.discount = 0,
    required this.grossAmount,
    required this.amount,
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
    );
  }
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
  final String firmId;

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
    required this.firmId,
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
      firmId: json['firm_id'] is Map
          ? json['firm_id']['_id'] ?? ''
          : json['firm_id'] ?? '',
    );
  }
}
