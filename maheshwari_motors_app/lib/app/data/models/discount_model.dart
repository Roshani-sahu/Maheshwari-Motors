class DiscountModel {
  final String id;
  final String type;
  final double percent1;
  final double percent2;
  final double fixedAmount;
  final double profitPercent;
  final String? itemId;
  final String? itemName;
  final String? partyId;
  final String? partyName;
  final String? itemGroupName;
  final List<String> itemIds;
  final bool isActive;

  static const List<String> typeOptions = [
    'item',
    'party_item',
    'party_all',
    'item_group',
    'profit_margin',
  ];

  DiscountModel({
    required this.id,
    required this.type,
    this.percent1 = 0,
    this.percent2 = 0,
    this.fixedAmount = 0,
    this.profitPercent = 0,
    this.itemId,
    this.itemName,
    this.partyId,
    this.partyName,
    this.itemGroupName,
    this.itemIds = const [],
    this.isActive = true,
  });

  factory DiscountModel.fromJson(Map<String, dynamic> json) {
    final item = json['item_id'];
    final party = json['party_id'];
    return DiscountModel(
      id: json['_id'] ?? '',
      type: json['type'] ?? 'item',
      percent1: (json['percent1'] ?? 0).toDouble(),
      percent2: (json['percent2'] ?? 0).toDouble(),
      fixedAmount: (json['fixed_amount'] ?? 0).toDouble(),
      profitPercent: (json['profit_percent'] ?? 0).toDouble(),
      itemId: item is Map ? item['_id'] : item?.toString(),
      itemName: item is Map ? item['item_name'] : null,
      partyId: party is Map ? party['_id'] : party?.toString(),
      partyName: party is Map ? party['name'] : null,
      itemGroupName: json['item_group_name'],
      itemIds: json['item_ids'] != null
          ? List<String>.from(
              (json['item_ids'] as List).map(
                (e) => e is Map ? e['_id'] ?? '' : e.toString(),
              ),
            )
          : [],
      isActive: json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{'type': type};
    if (percent1 > 0) map['percent1'] = percent1;
    if (percent2 > 0) map['percent2'] = percent2;
    if (fixedAmount > 0) map['fixed_amount'] = fixedAmount;
    if (profitPercent > 0) map['profit_percent'] = profitPercent;
    if (itemId != null) map['item_id'] = itemId;
    if (partyId != null) map['party_id'] = partyId;
    if (itemGroupName != null) map['item_group_name'] = itemGroupName;
    if (itemIds.isNotEmpty) map['item_ids'] = itemIds;
    return map;
  }

  String get displayValue {
    final parts = <String>[];
    if (percent1 > 0) parts.add('${percent1.toStringAsFixed(1)}%');
    if (percent2 > 0) parts.add('+${percent2.toStringAsFixed(1)}%');
    if (fixedAmount > 0) parts.add('₹${fixedAmount.toStringAsFixed(0)}');
    if (profitPercent > 0) parts.add('P:${profitPercent.toStringAsFixed(1)}%');
    if (parts.isEmpty) return '0%';
    return parts.join(' ');
  }

  String get targetName {
    switch (type) {
      case 'item':
        return itemName ?? 'Unknown Item';
      case 'party_item':
        return '${partyName ?? 'Party'} → ${itemName ?? 'Item'}';
      case 'party_all':
        return partyName ?? 'Unknown Party';
      case 'item_group':
        return itemGroupName ?? 'Unknown Group';
      case 'profit_margin':
        return itemName ?? 'Unknown Item';
      default:
        return 'Unknown';
    }
  }

  String get typeLabel {
    switch (type) {
      case 'item':
        return 'Item';
      case 'party_item':
        return 'Party+Item';
      case 'party_all':
        return 'Party All';
      case 'item_group':
        return 'Item Group';
      case 'profit_margin':
        return 'Profit Margin';
      default:
        return type;
    }
  }
}
