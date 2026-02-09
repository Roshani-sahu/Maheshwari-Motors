import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class InitialsAvatar extends StatelessWidget {
  final String name;
  final double radius;
  final Color? backgroundColor;
  final Color? textColor;
  final double? fontSize;

  const InitialsAvatar({
    super.key,
    required this.name,
    this.radius = 24,
    this.backgroundColor,
    this.textColor,
    this.fontSize,
  });

  @override
  Widget build(BuildContext context) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    final size = radius * 2;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.accentLight,
        borderRadius: BorderRadius.circular(radius > 28 ? 16 : 14),
      ),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            color: textColor ?? AppColors.accent,
            fontWeight: FontWeight.w700,
            fontSize: fontSize ?? (radius * 0.8),
          ),
        ),
      ),
    );
  }
}
