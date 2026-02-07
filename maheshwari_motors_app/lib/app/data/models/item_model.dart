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
    );
  }

  int get totalStock => physicalStock ?? (gstStock + nongstStock);
  bool get isLowStock => totalStock <= threshold;
  String get stockStatus => isLowStock ? 'LOW' : 'OK';
}
