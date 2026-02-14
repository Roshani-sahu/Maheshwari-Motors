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
  final int isGst;
  final String? brandId;
  final String? brandName;
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
    this.isGst = 1,
    this.brandId,
    this.brandName,
    this.supplierId,
  });

  factory ItemModel.fromJson(Map<String, dynamic> json) {
    final brand = json['brand_id'];
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
      isGst: json['is_gst'] ?? 1,
      brandId: brand is Map ? brand['_id'] : brand?.toString(),
      brandName: brand is Map ? brand['name'] : null,
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
      'is_gst': isGst,
    };
    if (image != null) map['image'] = image;
    if (physicalStock != null) map['physical_stock'] = physicalStock;
    if (nongstAvailable != null) map['nongst_available'] = nongstAvailable;
    if (brandId != null) map['brand_id'] = brandId;
    if (supplierId != null) map['supplier_id'] = supplierId;
    return map;
  }
}
