class SupplierModel {
  final String id;
  final String name;
  final String? phone;
  final String? email;
  final String? address;
  final String? city;
  final String? state;
  final String? gstin;

  SupplierModel({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.address,
    this.city,
    this.state,
    this.gstin,
  });

  factory SupplierModel.fromJson(Map<String, dynamic> json) {
    return SupplierModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'],
      email: json['email'],
      address: json['address'],
      city: json['city'],
      state: json['state'],
      gstin: json['gstin'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'address': address,
      'city': city,
      'state': state,
      'gstin': gstin,
    };
  }
}
