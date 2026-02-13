import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class AppBarAddButton extends StatelessWidget {
  final VoidCallback onPressed;

  const AppBarAddButton({super.key, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: IconButton(
        onPressed: onPressed,
        icon: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.accent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.add, color: AppColors.white, size: 18),
        ),
      ),
    );
  }
}
