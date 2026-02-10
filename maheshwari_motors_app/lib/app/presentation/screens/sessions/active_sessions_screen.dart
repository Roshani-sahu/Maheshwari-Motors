import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../controllers/active_sessions_controller.dart';

class ActiveSessionsScreen extends StatelessWidget {
  const ActiveSessionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<ActiveSessionsController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Active Sessions'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'revoke_all') {
                _confirmRevokeAll(context, controller);
              }
            },
            itemBuilder: (_) => [
              const PopupMenuItem(
                value: 'revoke_all',
                child: Text('Logout All Other Devices'),
              ),
            ],
          ),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        if (controller.sessions.isEmpty) {
          return const Center(child: Text('No active sessions found'));
        }

        return RefreshIndicator(
          onRefresh: controller.fetchSessions,
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: controller.sessions.length,
            itemBuilder: (context, index) {
              final session = controller.sessions[index];
              return _SessionCard(
                session: session,
                onRevoke: () =>
                    _confirmRevoke(context, controller, session['_id']),
              );
            },
          ),
        );
      }),
    );
  }

  void _confirmRevoke(
    BuildContext context,
    ActiveSessionsController controller,
    String sessionId,
  ) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Revoke Session'),
        content: const Text('This will log out the device. Are you sure?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              controller.revokeSession(sessionId);
            },
            child: const Text('Revoke', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _confirmRevokeAll(
    BuildContext context,
    ActiveSessionsController controller,
  ) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout All Other Devices'),
        content: const Text(
          'This will log you out from all other devices. Only the current session will remain active.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              controller.revokeAllOtherSessions();
            },
            child: const Text(
              'Logout All',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}

class _SessionCard extends StatelessWidget {
  final Map<String, dynamic> session;
  final VoidCallback onRevoke;

  const _SessionCard({required this.session, required this.onRevoke});

  @override
  Widget build(BuildContext context) {
    final isCurrent = session['is_current'] == true;
    final deviceName = session['device_name'] ?? 'Unknown Device';
    final deviceType = session['device_type'] ?? 'unknown';
    final lastActive = session['last_active'] != null
        ? DateTime.tryParse(session['last_active'].toString())
        : null;
    final createdAt = session['createdAt'] != null
        ? DateTime.tryParse(session['createdAt'].toString())
        : null;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: isCurrent ? 2 : 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isCurrent
            ? BorderSide(color: AppColors.accent, width: 1.5)
            : BorderSide.none,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Device icon
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isCurrent
                    ? AppColors.accent.withOpacity(0.1)
                    : AppColors.background,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                _getDeviceIcon(deviceType),
                color: isCurrent ? AppColors.accent : AppColors.textSecondary,
                size: 24,
              ),
            ),
            const SizedBox(width: 14),

            // Device info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          deviceName,
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ),
                      if (isCurrent)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'This Device',
                            style: TextStyle(
                              color: AppColors.accent,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _capitalizeDeviceType(deviceType),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (lastActive != null)
                    Text(
                      'Last active: ${_formatDateTime(lastActive)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                  if (createdAt != null)
                    Text(
                      'Logged in: ${_formatDateTime(createdAt)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                ],
              ),
            ),

            // Revoke button (only for non-current sessions)
            if (!isCurrent)
              IconButton(
                onPressed: onRevoke,
                icon: const Icon(Icons.logout, color: Colors.red, size: 20),
                tooltip: 'Revoke Session',
              ),
          ],
        ),
      ),
    );
  }

  IconData _getDeviceIcon(String deviceType) {
    switch (deviceType) {
      case 'android':
        return Icons.phone_android;
      case 'ios':
        return Icons.phone_iphone;
      case 'web':
        return Icons.language;
      case 'desktop':
        return Icons.computer;
      default:
        return Icons.devices;
    }
  }

  String _capitalizeDeviceType(String type) {
    if (type.isEmpty) return 'Unknown';
    switch (type) {
      case 'android':
        return 'Android';
      case 'ios':
        return 'iOS';
      case 'web':
        return 'Web Browser';
      case 'desktop':
        return 'Desktop';
      default:
        return type[0].toUpperCase() + type.substring(1);
    }
  }

  String _formatDateTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';

    return DateFormat('dd MMM yyyy, hh:mm a').format(dt);
  }
}
