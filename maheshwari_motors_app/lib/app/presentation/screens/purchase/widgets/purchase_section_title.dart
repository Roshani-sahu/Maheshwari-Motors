import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';

class PurchaseSectionTitle extends StatelessWidget {
  final String title;
  const PurchaseSectionTitle({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleSmall?.copyWith(
        color: AppColors.textPrimary,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}
