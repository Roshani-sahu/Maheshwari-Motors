class StockAlertModel {
  final String id;
  final String? itemId;
  final String? itemName;
  final int stockCount;
  final int threshold;
  final bool isResolved;
  final DateTime createdAt;

  StockAlertModel({
    required this.id,
    this.itemId,
    this.itemName,
    required this.stockCount,
    required this.threshold,
    this.isResolved = false,
    required this.createdAt,
  });

  factory StockAlertModel.fromJson(Map<String, dynamic> json) {
    final item = json['item_id'];
    return StockAlertModel(
      id: json['_id'] ?? '',
      itemId: item is Map ? item['_id'] : item?.toString(),
      itemName: item is Map ? item['item_name'] : null,
      stockCount: json['stock_count'] ?? 0,
      threshold: json['threshold'] ?? 0,
      isResolved: json['is_resolved'] ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    '_id': id,
    'item_id': itemId,
    'stock_count': stockCount,
    'threshold': threshold,
    'is_resolved': isResolved,
    'createdAt': createdAt.toIso8601String(),
  };
}
