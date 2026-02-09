class UserModel {
  final String id;
  final String username;
  final String email;
  final String type;
  final List<String> firmIds;
  final String? token;

  UserModel({
    required this.id,
    required this.username,
    required this.email,
    required this.type,
    this.firmIds = const [],
    this.token,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      type: json['type'] ?? 'main',
      firmIds: json['firm_ids'] != null
          ? List<String>.from(
              (json['firm_ids'] as List).map(
                (e) => e is String ? e : e['_id'] ?? '',
              ),
            )
          : [],
      token: json['token'],
    );
  }

  bool get isMain => type == 'main';

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      '_id': id,
      'username': username,
      'email': email,
      'type': type,
      'firm_ids': firmIds,
    };
    if (token != null) map['token'] = token;
    return map;
  }
}
