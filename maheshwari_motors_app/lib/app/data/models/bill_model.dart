class BillModel {
  final String id;
  final String billNo;
  final DateTime date;
  final String? partyId;
  final String? partyName;
  final double amount;
  final double paidAmount;
  final String paymentStatus;
  final List<String> challanIds;
  final String firmId;
  final double? balance;

  BillModel({
    required this.id,
    required this.billNo,
    required this.date,
    this.partyId,
    this.partyName,
    required this.amount,
    this.paidAmount = 0,
    this.paymentStatus = 'due',
    this.challanIds = const [],
    required this.firmId,
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
      paymentStatus: json['payment_status'] ?? 'due',
      challanIds: json['challan_ids'] != null
          ? List<String>.from(
              (json['challan_ids'] as List).map(
                (e) => e is String ? e : e['_id'] ?? '',
              ),
            )
          : [],
      firmId: json['firm_id'] is Map
          ? json['firm_id']['_id'] ?? ''
          : json['firm_id'] ?? '',
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
      'payment_status': paymentStatus,
      'challan_ids': challanIds,
      'firm_id': firmId,
    };
    if (partyId != null) map['party_id'] = partyId;
    if (balance != null) map['balance'] = balance;
    return map;
  }
}
