class DiscountField {
  final double normal;
  final double special;

  DiscountField({this.normal = 0, this.special = 0});

  double get total => normal + special;

  factory DiscountField.fromJson(Map<String, dynamic>? json) {
    if (json == null) return DiscountField();
    return DiscountField(
      normal: (json['normal'] ?? 0).toDouble(),
      special: (json['special'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {'normal': normal, 'special': special};
}

class DiscountModel {
  final String id;
  final String brandId;
  final String? brandName;
  final DiscountField discount1;
  final DiscountField discount2;

  DiscountModel({
    required this.id,
    required this.brandId,
    this.brandName,
    DiscountField? discount1,
    DiscountField? discount2,
  })  : discount1 = discount1 ?? DiscountField(),
        discount2 = discount2 ?? DiscountField();

  factory DiscountModel.fromJson(Map<String, dynamic> json) {
    final brand = json['brand_id'];
    return DiscountModel(
      id: json['_id'] ?? '',
      brandId: brand is Map ? brand['_id'] ?? '' : brand?.toString() ?? '',
      brandName: brand is Map ? brand['name'] : null,
      discount1: DiscountField.fromJson(json['discount1']),
      discount2: DiscountField.fromJson(json['discount2']),
    );
  }

  Map<String, dynamic> toJson() => {
        'brand_id': brandId,
        'discount1': discount1.toJson(),
        'discount2': discount2.toJson(),
      };

  String get discount1Display =>
      discount1.total > 0 ? '${discount1.total}%' : '-';
  String get discount2Display =>
      discount2.total > 0 ? '${discount2.total}%' : '-';
}
