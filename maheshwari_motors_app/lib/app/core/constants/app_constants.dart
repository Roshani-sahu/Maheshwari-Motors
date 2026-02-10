class AppConstants {
  AppConstants._();

  static const String appName = 'Maheshwari Motors';
  static const String baseUrl =
      'https://api-maheshwari-motors.koyeb.app/api/v1';

  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String selectedFirmKey = 'selected_firm';

  static const int pageSize = 20;
  static const Duration apiTimeout = Duration(seconds: 30);
}
