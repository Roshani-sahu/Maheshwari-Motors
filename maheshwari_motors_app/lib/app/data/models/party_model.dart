class PartyModel {
  final String id;
  final int? numericId;
  final String name;
  final String? phone;
  final String? email;
  final String? address;
  final String? city;
  final String? state;
  final String? gstin;
  final double balance;

  PartyModel({
    required this.id,
    this.numericId,
    required this.name,
    this.phone,
    this.email,
    this.address,
    this.city,
    this.state,
    this.gstin,
    this.balance = 0,
  });

  factory PartyModel.fromJson(Map<String, dynamic> json) {
    return PartyModel(
      id: json['_id'] ?? '',
      numericId: json['id'],
      name: json['name'] ?? '',
      phone: json['phone'],
      email: json['email'],
      address: json['address'],
      city: json['city'],
      state: json['state'],
      gstin: json['gstin'],
      balance: (json['balance'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{'_id': id, 'name': name, 'balance': balance};
    if (phone != null) map['phone'] = phone;
    if (email != null) map['email'] = email;
    if (address != null) map['address'] = address;
    if (city != null) map['city'] = city;
    if (state != null) map['state'] = state;
    if (gstin != null) map['gstin'] = gstin;
    return map;
  }
}
