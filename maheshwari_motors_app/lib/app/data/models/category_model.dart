class CategoryModel {
  final String id;
  final String name;
  final String? description;

  CategoryModel({required this.id, required this.name, this.description});

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{'_id': id, 'name': name};
    if (description != null) map['description'] = description;
    return map;
  }
}
