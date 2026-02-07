class AppConstants {
  AppConstants._();

  static const String appName = 'Maheshwari Motors';
  static const String baseUrl = 'http://10.0.2.2:3030/api/v1';
  // For physical device, use your machine's local IP:
  // static const String baseUrl = 'http://192.168.x.x:3030/api/v1';

  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String selectedFirmKey = 'selected_firm';

  static const int pageSize = 20;
  static const Duration apiTimeout = Duration(seconds: 30);
}
