import 'challan_item_model.dart';

class ChallanModel {
  final String id;
  final int? numericId;
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
    this.numericId,
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
      numericId: json['id'],
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
