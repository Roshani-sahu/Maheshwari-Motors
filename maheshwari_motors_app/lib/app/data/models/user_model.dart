import 'firm_model.dart';

class UserModel {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String type;
  final bool isAdmin;
  final String role;
  final String? token;

  final FirmDataModel? firmData;

  final FirmDataModel? gstFirm;
  final FirmDataModel? nongstFirm;
  final bool isActive;

  UserModel({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    required this.type,
    this.isAdmin = false,
    this.role = 'firm',
    this.token,
    this.firmData,
    this.gstFirm,
    this.nongstFirm,
    this.isActive = true,
  });

  factory UserModel.fromLoginJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'],
      phone: json['phone'],
      type: json['type'] ?? 'main',
      isAdmin: json['is_admin'] ?? false,
      role: json['role'] ?? 'firm',
      token: json['token'],
      firmData: json['firm_data'] != null
          ? FirmDataModel.fromJson(json['firm_data'])
          : null,
    );
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'],
      phone: json['phone'],
      type: json['type'] ?? 'main',
      isAdmin: json['current_role'] == 'admin' || json['type'] == 'main',
      role: json['current_role'] ?? 'firm',
      gstFirm: json['gst_firm'] != null
          ? FirmDataModel.fromJson(json['gst_firm'])
          : null,
      nongstFirm: json['nongst_firm'] != null
          ? FirmDataModel.fromJson(json['nongst_firm'])
          : null,
      isActive: json['is_active'] ?? true,
      firmData: json['current_firm_type'] != null
          ? FirmDataModel.fromJson(
              json['current_firm_type'] == 'GST'
                  ? json['gst_firm'] ?? {}
                  : json['nongst_firm'] ?? {},
            )
          : null,
    );
  }

  bool get isMain => type == 'main';
  bool get isFirmLogin => role == 'firm';
  bool get isAdminLogin => role == 'admin';
  String get firmType => firmData?.firmType ?? '';

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      '_id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'type': type,
      'is_admin': isAdmin,
      'role': role,
    };
    if (token != null) map['token'] = token;
    if (firmData != null) map['firm_data'] = firmData!.toJson();
    return map;
  }
}
