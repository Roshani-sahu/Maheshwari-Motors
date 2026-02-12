class BillModel {
  final String id;
  final String billNo;
  final DateTime date;
  final String? partyId;
  final String? partyName;
  final double amount;
  final double paidAmount;
  final double returnAmount;
  final String paymentStatus;
  final List<String> challanIds;
  final bool skipStockCalculation;
  final int isGst;
  final double? balance;

  BillModel({
    required this.id,
    required this.billNo,
    required this.date,
    this.partyId,
    this.partyName,
    required this.amount,
    this.paidAmount = 0,
    this.returnAmount = 0,
    this.paymentStatus = 'due',
    this.challanIds = const [],
    this.skipStockCalculation = false,
    this.isGst = 1,
    this.balance,
  });

  factory BillModel.fromJson(Map<String, dynamic> json) {
    final partyData = json['party_id'];
    return BillModel(
      id: json['_id'] ?? '',
      billNo: json['bill_no'] ?? '',
      date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
      partyId: partyData is Map ? partyData['_id'] : partyData?.toString(),
      partyName: partyData is Map ? partyData['name'] : null,
      amount: (json['amount'] ?? 0).toDouble(),
      paidAmount: (json['paid_amount'] ?? 0).toDouble(),
      returnAmount: (json['return_amount'] ?? 0).toDouble(),
      paymentStatus: json['payment_status'] ?? 'due',
      challanIds: json['challan_ids'] != null
          ? List<String>.from(
              (json['challan_ids'] as List).map(
                (e) => e is String ? e : e['_id'] ?? '',
              ),
            )
          : [],
      skipStockCalculation: json['skip_stock_calculation'] ?? false,
      isGst: json['is_gst'] ?? 1,
      balance: json['balance']?.toDouble(),
    );
  }

  double get balanceAmount => balance ?? (amount - paidAmount);

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      '_id': id,
      'bill_no': billNo,
      'date': date.toIso8601String(),
      'amount': amount,
      'paid_amount': paidAmount,
      'return_amount': returnAmount,
      'payment_status': paymentStatus,
      'challan_ids': challanIds,
      'skip_stock_calculation': skipStockCalculation,
      'is_gst': isGst,
    };
    if (partyId != null) map['party_id'] = partyId;
    if (balance != null) map['balance'] = balance;
    return map;
  }
}
