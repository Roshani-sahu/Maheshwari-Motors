import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_theme.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/contact_card.dart';
import 'widgets/faq_item.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const AppDrawerButton(),
        title: const Text('Help & Support'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.accent,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppColors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    Icons.business,
                    color: AppColors.white,
                    size: 32,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'ERP System',
                  style: TextStyle(
                    color: AppColors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Maheshwari Motors',
                  style: TextStyle(
                    color: AppColors.white.withValues(alpha: 0.8),
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'v1.0.0',
                  style: TextStyle(
                    color: AppColors.white.withValues(alpha: 0.6),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          Text(
            'GET IN TOUCH',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          ContactCard(
            icon: Icons.email_outlined,
            title: 'Email Support',
            subtitle: 'support@maheshwarimotors.com',
            onTap: () => _launchUrl('mailto:support@maheshwarimotors.com'),
          ),
          const SizedBox(height: 10),
          ContactCard(
            icon: Icons.phone_outlined,
            title: 'Phone Support',
            subtitle: 'Call us for immediate help',
            onTap: () => _launchUrl('tel:+919876543210'),
          ),
          const SizedBox(height: 24),

          Text(
            'FREQUENTLY ASKED QUESTIONS',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          FaqItem(
            question: 'How do I create a challan?',
            answer:
                'Go to Transactions → Challan List and tap the + button to create a new delivery challan.',
          ),
          FaqItem(
            question: 'How do I convert challans to bills?',
            answer:
                'Go to Bills → Generate Bill, select a party, choose the challans to convert, and generate the bill.',
          ),
          FaqItem(
            question: 'How can I manage stock alerts?',
            answer:
                'Go to Inventory → Stock Alert Master to view items below their threshold levels.',
          ),
          FaqItem(
            question: 'How do I switch between firms?',
            answer:
                'Open the drawer menu and tap "Switch Firm" under the Account section.',
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Future<void> _launchUrl(String url) async {
    try {
      await launchUrl(Uri.parse(url));
    } catch (_) {
      Get.snackbar('Error', 'Could not open the link');
    }
  }
}
