import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../controllers/auth_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../data/models/firm_model.dart';
import '../../../data/services/api_service.dart';
import '../../../routes/app_routes.dart';

class FirmSelectionScreen extends StatefulWidget {
  const FirmSelectionScreen({super.key});

  @override
  State<FirmSelectionScreen> createState() => _FirmSelectionScreenState();
}

class _FirmSelectionScreenState extends State<FirmSelectionScreen> {
  final AuthController _auth = Get.find<AuthController>();
  final ApiService _api = ApiService();

  List<FirmModel> _firms = [];
  bool _isLoading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadFirms();
  }

  Future<void> _loadFirms() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });
    try {
      _firms = await _api.getFirms();
    } catch (e) {
      _error = ApiClient.parseError(e);
    }
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 24),
              // Header row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Select Firm',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Choose a firm to continue',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => _auth.logout(),
                    icon: const Icon(Icons.logout_rounded),
                    tooltip: 'Logout',
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.errorLight,
                      foregroundColor: AppColors.error,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Add firm button
              if (_auth.isMainUser)
                InkWell(
                  onTap: () async {
                    final result = await Get.toNamed(AppRoutes.addFirm);
                    if (result == true) _loadFirms();
                  },
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: AppColors.accent,
                        style: BorderStyle.solid,
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(14),
                      color: AppColors.accentLight.withValues(alpha: 0.3),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.accent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.add_business_rounded,
                            color: AppColors.white,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Text(
                          'Add New Firm',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(color: AppColors.accent),
                        ),
                        const Spacer(),
                        const Icon(
                          Icons.arrow_forward_ios,
                          size: 16,
                          color: AppColors.accent,
                        ),
                      ],
                    ),
                  ),
                ),

              const SizedBox(height: 20),

              // Firms list
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _error.isNotEmpty
                    ? ErrorState(message: _error, onRetry: _loadFirms)
                    : _firms.isEmpty
                    ? const EmptyState(
                        icon: Icons.business_outlined,
                        title: 'No firms yet',
                        subtitle: 'Create your first firm to get started',
                      )
                    : RefreshIndicator(
                        onRefresh: _loadFirms,
                        child: ListView.separated(
                          itemCount: _firms.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final firm = _firms[index];
                            return _FirmCard(
                              firm: firm,
                              onTap: () => _auth.selectFirm(firm),
                            );
                          },
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FirmCard extends StatelessWidget {
  final FirmModel firm;
  final VoidCallback onTap;

  const _FirmCard({required this.firm, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.secondary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.business_rounded,
                color: AppColors.secondary,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    firm.name,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${firm.city} • ${firm.displayType}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            StatusBadge.gst(firm.type),
            const SizedBox(width: 8),
            const Icon(
              Icons.arrow_forward_ios,
              size: 14,
              color: AppColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }
}
