class PartyModel {
  final String id;
  final String name;
  final String? phone;
  final String? email;
  final String? address;
  final String? city;
  final String? state;
  final String? gstin;
  final double balance;
  final String firmId;

  PartyModel({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.address,
    this.city,
    this.state,
    this.gstin,
    this.balance = 0,
    required this.firmId,
  });

  factory PartyModel.fromJson(Map<String, dynamic> json) {
    return PartyModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'],
      email: json['email'],
      address: json['address'],
      city: json['city'],
      state: json['state'],
      gstin: json['gstin'],
      balance: (json['balance'] ?? 0).toDouble(),
      firmId: json['firm_id'] is Map
          ? json['firm_id']['_id'] ?? ''
          : json['firm_id'] ?? '',
    );
  }
}
