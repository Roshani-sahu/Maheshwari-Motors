class ItemModel {
  final String id;
  final int? numericId;
  final String itemName;
  final double saleRate;
  final double purchaseRate;
  final double mrpRate;
  final double gstPercent;
  final double discount;
  final int stock;
  final int threshold;
  final String? image;
  final int isGst;
  final String? categoryId;
  final String? categoryName;
  final String? brandId;
  final String? brandName;
  final String? supplierId;

  ItemModel({
    required this.id,
    this.numericId,
    required this.itemName,
    required this.saleRate,
    this.purchaseRate = 0,
    this.mrpRate = 0,
    this.gstPercent = 0,
    this.discount = 0,
    this.stock = 0,
    this.threshold = 0,
    this.image,
    this.isGst = 1,
    this.categoryId,
    this.categoryName,
    this.brandId,
    this.brandName,
    this.supplierId,
  });

  factory ItemModel.fromJson(Map<String, dynamic> json) {
    final brand = json['brand_id'];
    final category = json['category_id'];
    final supplier = json['supplier_id'];
    return ItemModel(
      id: json['_id'] ?? '',
      numericId: json['id'],
      itemName: json['item_name'] ?? '',
      saleRate: (json['sale_rate'] ?? 0).toDouble(),
      purchaseRate: (json['purchase_rate'] ?? 0).toDouble(),
      mrpRate: (json['mrp_rate'] ?? 0).toDouble(),
      gstPercent: (json['gst_percent'] ?? 0).toDouble(),
      discount: (json['discount'] ?? 0).toDouble(),
      stock: json['stock'] ?? 0,
      threshold: json['threshold'] ?? 0,
      image: json['image'],
      isGst: json['is_gst'] ?? 1,
      categoryId: category is Map ? category['_id'] : category?.toString(),
      categoryName: category is Map ? category['name'] : null,
      brandId: brand is Map ? brand['_id'] : brand?.toString(),
      brandName: brand is Map ? brand['name'] : null,
      supplierId: supplier is Map ? supplier['_id'] : supplier?.toString(),
    );
  }

  int get totalStock => stock;
  bool get isLowStock => stock <= threshold;
  String get stockStatus => isLowStock ? 'LOW' : 'OK';

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      '_id': id,
      'item_name': itemName,
      'sale_rate': saleRate,
      'purchase_rate': purchaseRate,
      'mrp_rate': mrpRate,
      'gst_percent': gstPercent,
      'discount': discount,
      'stock': stock,
      'threshold': threshold,
      'is_gst': isGst,
    };
    if (image != null) map['image'] = image;
    if (categoryId != null) map['category_id'] = categoryId;
    if (brandId != null) map['brand_id'] = brandId;
    if (supplierId != null) map['supplier_id'] = supplierId;
    return map;
  }
}
