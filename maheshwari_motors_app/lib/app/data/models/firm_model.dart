class FirmDataModel {
  final String firmType;
  final String name;
  final String? username;
  final String phone;
  final String email;
  final String address;
  final String city;
  final String state;
  final String? godownAddress;
  final String? gstin;
  final String? cin;
  final String? regNumber;
  final String? bankName;
  final String? bankBranch;
  final String? ifscCode;
  final String? accountNumber;

  FirmDataModel({
    required this.firmType,
    required this.name,
    this.username,
    required this.phone,
    required this.email,
    required this.address,
    required this.city,
    required this.state,
    this.godownAddress,
    this.gstin,
    this.cin,
    this.regNumber,
    this.bankName,
    this.bankBranch,
    this.ifscCode,
    this.accountNumber,
  });

  factory FirmDataModel.fromJson(Map<String, dynamic> json) {
    return FirmDataModel(
      firmType: json['firm_type'] ?? 'NON_GST',
      name: json['name'] ?? '',
      username: json['username'],
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      address: json['address'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      godownAddress: json['godown_address'],
      gstin: json['GSTIN'],
      cin: json['CIN'],
      regNumber: json['reg_number'],
      bankName: json['bank_name'],
      bankBranch: json['bank_branch'],
      ifscCode: json['ifsc_code'],
      accountNumber: json['account_number'],
    );
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'firm_type': firmType,
      'name': name,
      'phone': phone,
      'email': email,
      'address': address,
      'city': city,
      'state': state,
    };
    if (username != null) map['username'] = username;
    if (godownAddress != null) map['godown_address'] = godownAddress;
    if (gstin != null) map['GSTIN'] = gstin;
    if (cin != null) map['CIN'] = cin;
    if (regNumber != null) map['reg_number'] = regNumber;
    if (bankName != null) map['bank_name'] = bankName;
    if (bankBranch != null) map['bank_branch'] = bankBranch;
    if (ifscCode != null) map['ifsc_code'] = ifscCode;
    if (accountNumber != null) map['account_number'] = accountNumber;
    return map;
  }

  bool get isGST => firmType == 'GST';
  String get displayType => isGST ? 'GST' : 'NON-GST';
}
