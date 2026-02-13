import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class DrawerSectionDivider extends StatelessWidget {
  const DrawerSectionDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Divider(height: 1, color: AppColors.border.withValues(alpha: 0.4)),
    );
  }
}
