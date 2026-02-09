class TransactionModel {
  final String id;
  final String type; // sale / purchase
  final String? partyId;
  final String? partyName;
  final String? supplierId;
  final String? supplierName;
  final String? billId;
  final String? billNo;
  final String? purchaseId;
  final double amount;
  final String paymentMode;
  final String? utr;
  final String? transactionRef;
  final String? remarks;
  final String firmId;
  final String? firmName;
  final DateTime createdAt;

  TransactionModel({
    required this.id,
    required this.type,
    this.partyId,
    this.partyName,
    this.supplierId,
    this.supplierName,
    this.billId,
    this.billNo,
    this.purchaseId,
    required this.amount,
    this.paymentMode = 'cash',
    this.utr,
    this.transactionRef,
    this.remarks,
    required this.firmId,
    this.firmName,
    required this.createdAt,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    final party = json['party_id'];
    final supplier = json['supplier_id'];
    final bill = json['bill_id'];
    final firm = json['firm_id'];

    return TransactionModel(
      id: json['_id'] ?? '',
      type: json['type'] ?? 'sale',
      partyId: party is Map ? party['_id'] : party?.toString(),
      partyName: party is Map ? party['name'] : null,
      supplierId: supplier is Map ? supplier['_id'] : supplier?.toString(),
      supplierName: supplier is Map ? supplier['name'] : null,
      billId: bill is Map ? bill['_id'] : bill?.toString(),
      billNo: bill is Map ? bill['bill_no'] : null,
      purchaseId: json['purchase_id']?.toString(),
      amount: (json['amount'] ?? 0).toDouble(),
      paymentMode: json['payment_mode'] ?? 'cash',
      utr: json['utr'],
      transactionRef: json['transaction_ref'],
      remarks: json['remarks'],
      firmId: firm is Map ? firm['_id'] ?? '' : firm ?? '',
      firmName: firm is Map ? firm['name'] : null,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      '_id': id,
      'type': type,
      'amount': amount,
      'payment_mode': paymentMode,
      'firm_id': firmId,
      'createdAt': createdAt.toIso8601String(),
    };
    if (partyId != null) map['party_id'] = partyId;
    if (supplierId != null) map['supplier_id'] = supplierId;
    if (billId != null) map['bill_id'] = billId;
    if (purchaseId != null) map['purchase_id'] = purchaseId;
    if (utr != null) map['utr'] = utr;
    if (transactionRef != null) map['transaction_ref'] = transactionRef;
    if (remarks != null) map['remarks'] = remarks;
    return map;
  }
}
