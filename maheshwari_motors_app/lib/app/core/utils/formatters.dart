import 'package:intl/intl.dart';

class AppFormatters {
  AppFormatters._();

  static final NumberFormat _currency = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  static final NumberFormat _currencyDecimal = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 2,
  );

  static final DateFormat _dateShort = DateFormat('dd MMM yyyy');
  static final DateFormat _dateFull = DateFormat('dd/MM/yyyy');
  static final DateFormat _dateTime = DateFormat('dd MMM yyyy, hh:mm a');

  static String currency(num amount) => _currency.format(amount);

  static String currencyDecimal(num amount) => _currencyDecimal.format(amount);

  static String dateShort(DateTime date) => _dateShort.format(date);

  static String dateFull(DateTime date) => _dateFull.format(date);

  static String dateTime(DateTime date) => _dateTime.format(date);

  static String quantity(num value) =>
      NumberFormat('#,##,###', 'en_IN').format(value);

  static String parseDateString(dynamic date) {
    if (date == null) return '';
    try {
      return _dateFull.format(DateTime.parse(date.toString()));
    } catch (_) {
      return date.toString();
    }
  }
}
