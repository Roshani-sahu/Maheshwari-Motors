/// Reusable form field validators for TextFormField / AppTextField.
class AppValidators {
  AppValidators._();

  static final _emailRegExp = RegExp(
    r'^[\w\.\-\+]+@([\w\-]+\.)+[\w\-]{2,}$',
    caseSensitive: false,
  );

  static final _phoneRegExp = RegExp(r'^\d{10}$');

  static final _gstinRegExp = RegExp(
    r'^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$',
  );

  /// Returns null if valid, error message otherwise.
  static String? required(String? value, [String fieldName = 'This field']) {
    if (value == null || value.trim().isEmpty) return '$fieldName is required';
    return null;
  }

  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) return null; // optional
    if (!_emailRegExp.hasMatch(value.trim())) return 'Enter a valid email';
    return null;
  }

  static String? requiredEmail(String? value) {
    if (value == null || value.trim().isEmpty) return 'Email is required';
    if (!_emailRegExp.hasMatch(value.trim())) return 'Enter a valid email';
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.trim().isEmpty) return null; // optional
    if (!_phoneRegExp.hasMatch(value.trim())) {
      return 'Enter a valid 10-digit phone number';
    }
    return null;
  }

  static String? gstin(String? value) {
    if (value == null || value.trim().isEmpty) return null; // optional
    if (!_gstinRegExp.hasMatch(value.trim().toUpperCase())) {
      return 'Enter a valid 15-character GSTIN';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return null;
  }

  /// Password field that is optional (for edit mode).
  static String? optionalPassword(String? value) {
    if (value == null || value.isEmpty) return null;
    if (value.length < 6) return 'Password must be at least 6 characters';
    return null;
  }
}
