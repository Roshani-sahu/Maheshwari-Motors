import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/sessions/active_sessions_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import 'widgets/session_card.dart';

class ActiveSessionsScreen extends StatelessWidget {
  const ActiveSessionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<ActiveSessionsController>();

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        leading: const AppDrawerButton(),
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
              return SessionCard(
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
