import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class DrawerSectionHeader extends StatelessWidget {
  final String title;
  const DrawerSectionHeader({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 6),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: AppColors.textSecondary,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.3,
          fontSize: 10,
        ),
      ),
    );
  }
}
