import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color? textColor;

  const StatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.textColor,
  });

  factory StatusBadge.gst(String type) {
    final isGst = type == 'GST';
    return StatusBadge(
      label: isGst ? 'GST' : 'NON-GST',
      color: isGst ? AppColors.successLight : AppColors.infoLight,
      textColor: isGst ? AppColors.success : AppColors.info,
    );
  }

  factory StatusBadge.stock(String status) {
    return StatusBadge(
      label: status,
      color: status == 'LOW' ? AppColors.errorLight : AppColors.successLight,
      textColor: status == 'LOW' ? AppColors.error : AppColors.success,
    );
  }

  factory StatusBadge.payment(String status) {
    Color bg, fg;
    switch (status.toLowerCase()) {
      case 'paid':
        bg = AppColors.successLight;
        fg = AppColors.success;
      case 'overpaid':
        bg = AppColors.infoLight;
        fg = AppColors.info;
      case 'due':
        bg = AppColors.errorLight;
        fg = AppColors.error;
      case 'partial':
        bg = AppColors.warningLight;
        fg = AppColors.warning;
      default:
        bg = AppColors.warningLight;
        fg = AppColors.warning;
    }
    return StatusBadge(label: status.toUpperCase(), color: bg, textColor: fg);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor ?? AppColors.textPrimary,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
