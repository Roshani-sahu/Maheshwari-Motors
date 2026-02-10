import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/services/api_service.dart';
import 'app_button.dart';
import 'app_snackbar.dart';
import 'app_text_field.dart';

class RecordPaymentSheet extends StatefulWidget {
  final String firmId;
  final String referenceId;
  final String referenceLabel;
  final double totalAmount;
  final double paidAmount;
  final bool isSale;

  const RecordPaymentSheet({
    super.key,
    required this.firmId,
    required this.referenceId,
    required this.referenceLabel,
    required this.totalAmount,
    required this.paidAmount,
    required this.isSale,
  });

  static Future<bool?> show({
    required BuildContext context,
    required String firmId,
    required String referenceId,
    required String referenceLabel,
    required double totalAmount,
    required double paidAmount,
    required bool isSale,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => RecordPaymentSheet(
        firmId: firmId,
        referenceId: referenceId,
        referenceLabel: referenceLabel,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        isSale: isSale,
      ),
    );
  }

  @override
  State<RecordPaymentSheet> createState() => _RecordPaymentSheetState();
}

class _RecordPaymentSheetState extends State<RecordPaymentSheet> {
  final _formKey = GlobalKey<FormState>();
  final _amountC = TextEditingController();
  final _utrC = TextEditingController();
  final _remarksC = TextEditingController();
  String _paymentMode = 'cash';
  bool _isLoading = false;

  double get _balance => widget.totalAmount - widget.paidAmount;

  @override
  void initState() {
    super.initState();
    if (_balance > 0) {
      _amountC.text = _balance.toStringAsFixed(0);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final api = Get.find<ApiService>();
      final data = <String, dynamic>{
        'amount': double.parse(_amountC.text.trim()),
        'payment_mode': _paymentMode,
      };
      if (_paymentMode == 'bank' && _utrC.text.trim().isNotEmpty) {
        data['utr'] = _utrC.text.trim();
      }
      if (_remarksC.text.trim().isNotEmpty) {
        data['remarks'] = _remarksC.text.trim();
      }

      if (widget.isSale) {
        data['bill_id'] = widget.referenceId;
        await api.createSaleTransaction(widget.firmId, data);
      } else {
        data['purchase_id'] = widget.referenceId;
        await api.createPurchaseTransaction(widget.firmId, data);
      }

      AppSnackbar.success('Payment recorded');
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _amountC.dispose();
    _utrC.dispose();
    _remarksC.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Record Payment',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 4),
              Text(
                widget.referenceLabel,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),

              // Summary
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _InfoChip(
                      label: 'Total',
                      value: AppFormatters.currency(widget.totalAmount),
                    ),
                    _InfoChip(
                      label: 'Paid',
                      value: AppFormatters.currency(widget.paidAmount),
                      color: AppColors.success,
                    ),
                    _InfoChip(
                      label: 'Balance',
                      value: AppFormatters.currency(_balance),
                      color: _balance > 0 ? AppColors.error : AppColors.success,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Amount
              AppTextField(
                label: 'Amount *',
                controller: _amountC,
                hint: 'Enter payment amount',
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'Amount is required';
                  }
                  final n = double.tryParse(v.trim());
                  if (n == null || n <= 0) return 'Enter a valid amount';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Payment Mode
              Text(
                'Payment Mode',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: ['cash', 'bank', 'credit'].map((mode) {
                  final selected = _paymentMode == mode;
                  return Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(right: mode != 'credit' ? 8 : 0),
                      child: ChoiceChip(
                        label: Text(mode.capitalizeFirst!),
                        selected: selected,
                        onSelected: (_) => setState(() => _paymentMode = mode),
                        selectedColor: AppColors.accentLight,
                        labelStyle: TextStyle(
                          color: selected
                              ? AppColors.accent
                              : AppColors.textSecondary,
                          fontWeight: selected
                              ? FontWeight.w600
                              : FontWeight.w400,
                        ),
                        showCheckmark: false,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              // UTR (bank only)
              if (_paymentMode == 'bank') ...[
                AppTextField(
                  label: 'UTR / Reference',
                  controller: _utrC,
                  hint: 'Transaction reference number',
                ),
                const SizedBox(height: 16),
              ],

              // Remarks
              AppTextField(
                label: 'Remarks',
                controller: _remarksC,
                hint: 'Optional notes',
              ),
              const SizedBox(height: 24),

              // Submit
              AppButton(
                text: 'Record Payment',
                isLoading: _isLoading,
                onPressed: _submit,
                icon: Icons.payment_rounded,
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final String label;
  final String value;
  final Color? color;
  const _InfoChip({required this.label, required this.value, this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 14,
            color: color ?? AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}
