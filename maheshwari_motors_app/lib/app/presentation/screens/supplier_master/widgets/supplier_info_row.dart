import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';

class SupplierInfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const SupplierInfoRow({super.key, required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 13, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodySmall,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
