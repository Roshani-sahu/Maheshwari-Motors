class CategoryBrandRef {
  final String id;
  final String name;
  final int itemCount;

  CategoryBrandRef({required this.id, this.name = '', this.itemCount = 0});
}

class CategoryModel {
  final String id;
  final String name;
  final String? description;
  final List<CategoryBrandRef> brands;

  List<String> get brandIds => brands.map((b) => b.id).toList();

  CategoryModel({
    required this.id,
    required this.name,
    this.description,
    this.brands = const [],
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    final rawBrands = json['brand_ids'] as List? ?? [];
    return CategoryModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      brands: rawBrands.map((e) {
        if (e is Map<String, dynamic>) {
          return CategoryBrandRef(
            id: e['_id']?.toString() ?? '',
            name: e['name'] ?? '',
            itemCount: (e['item_ids'] as List?)?.length ?? 0,
          );
        }
        return CategoryBrandRef(id: e.toString());
      }).toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'category_name': name, 'brands': brandIds};
  }
}
