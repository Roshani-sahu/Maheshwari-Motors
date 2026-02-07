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
}
