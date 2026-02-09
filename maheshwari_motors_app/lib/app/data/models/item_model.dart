class ItemModel {
  final String id;
  final String itemName;
  final double amount;
  final String? image;
  final int threshold;
  final int gstStock;
  final int nongstStock;
  final int nongstSold;
  final int? physicalStock;
  final int? nongstAvailable;
  final List<String> categoryIds;
  final String? supplierId;

  ItemModel({
    required this.id,
    required this.itemName,
    required this.amount,
    this.image,
    this.threshold = 0,
    this.gstStock = 0,
    this.nongstStock = 0,
    this.nongstSold = 0,
    this.physicalStock,
    this.nongstAvailable,
    this.categoryIds = const [],
    this.supplierId,
  });

  factory ItemModel.fromJson(Map<String, dynamic> json) {
    return ItemModel(
      id: json['_id'] ?? '',
      itemName: json['item_name'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      image: json['image'],
      threshold: json['threshold'] ?? 0,
      gstStock: json['gst_stock'] ?? 0,
      nongstStock: json['nongst_stock'] ?? 0,
      nongstSold: json['nongst_sold'] ?? 0,
      physicalStock: json['physical_stock'],
      nongstAvailable: json['nongst_available'],
      categoryIds:
          (json['category_ids'] as List?)
              ?.map((e) => e is Map ? e['_id'].toString() : e.toString())
              .toList() ??
          [],
      supplierId: json['supplier_id'] is Map
          ? json['supplier_id']['_id']
          : json['supplier_id'],
    );
  }

  int get totalStock => physicalStock ?? (gstStock + nongstStock);
  bool get isLowStock => totalStock <= threshold;
  String get stockStatus => isLowStock ? 'LOW' : 'OK';

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      '_id': id,
      'item_name': itemName,
      'amount': amount,
      'threshold': threshold,
      'gst_stock': gstStock,
      'nongst_stock': nongstStock,
      'nongst_sold': nongstSold,
    };
    if (image != null) map['image'] = image;
    if (physicalStock != null) map['physical_stock'] = physicalStock;
    if (nongstAvailable != null) map['nongst_available'] = nongstAvailable;
    if (categoryIds.isNotEmpty) map['category_ids'] = categoryIds;
    if (supplierId != null) map['supplier_id'] = supplierId;
    return map;
  }
}
