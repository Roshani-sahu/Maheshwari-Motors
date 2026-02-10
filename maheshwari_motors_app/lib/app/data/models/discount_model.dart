class DiscountModel {
  final String id;
  final String type; // item or party
  final String discountType; // percentage or fixed
  final double value;
  final String? itemId;
  final String? itemName;
  final String? partyId;
  final String? partyName;

  DiscountModel({
    required this.id,
    required this.type,
    required this.discountType,
    required this.value,
    this.itemId,
    this.itemName,
    this.partyId,
    this.partyName,
  });

  factory DiscountModel.fromJson(Map<String, dynamic> json) {
    final item = json['item_id'];
    final party = json['party_id'];
    return DiscountModel(
      id: json['_id'] ?? '',
      type: json['type'] ?? 'item',
      discountType: json['discount_type'] ?? 'percentage',
      value: (json['value'] ?? 0).toDouble(),
      itemId: item is Map ? item['_id'] : item?.toString(),
      itemName: item is Map ? item['item_name'] : null,
      partyId: party is Map ? party['_id'] : party?.toString(),
      partyName: party is Map ? party['name'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'type': type,
      'discount_type': discountType,
      'value': value,
    };
    if (itemId != null) map['item_id'] = itemId;
    if (partyId != null) map['party_id'] = partyId;
    return map;
  }

  String get displayValue {
    if (discountType == 'fixed') return '₹${value.toStringAsFixed(0)}';
    return '${value.toStringAsFixed(1)}%';
  }

  String get targetName {
    if (type == 'item') return itemName ?? 'Unknown Item';
    return partyName ?? 'Unknown Party';
  }
}
