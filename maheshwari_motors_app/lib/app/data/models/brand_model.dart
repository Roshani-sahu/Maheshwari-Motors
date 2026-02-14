class BrandModel {
  final String id;
  final String name;
  final List<String> itemIds;

  BrandModel({
    required this.id,
    required this.name,
    this.itemIds = const [],
  });

  factory BrandModel.fromJson(Map<String, dynamic> json) {
    return BrandModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      itemIds: (json['item_ids'] as List?)
              ?.map((e) => e is Map ? e['_id'].toString() : e.toString())
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {'brand_name': name};
  }
}
