import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/supplier_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class SupplierMasterScreen extends GetView<SupplierMasterController> {
  const SupplierMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Suppliers'),
        actions: [
          AppBarAddButton(onPressed: () => Get.toNamed(AppRoutes.addSupplier)),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }
        if (controller.suppliers.isEmpty) {
          return const EmptyState(
            icon: Icons.local_shipping,
            title: 'No suppliers found',
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: controller.suppliers.length,
          itemBuilder: (context, index) {
            final supplier = controller.suppliers[index];
            return Card(
              child: ListTile(
                title: Text(supplier.name),
                subtitle: Text(supplier.phone ?? (supplier.city ?? '')),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ActionIcon(
                      icon: Icons.edit,
                      color: Colors.blue,
                      onTap: () => Get.toNamed(
                        AppRoutes.editSupplier,
                        arguments: supplier,
                      ),
                    ),
                    const SizedBox(width: 8),
                    ActionIcon(
                      icon: Icons.delete,
                      color: Colors.red,
                      onTap: () {
                        Get.bottomSheet(
                          DeleteConfirmSheet(
                            title: 'Delete Supplier?',
                            subtitle: 'This action cannot be undone.',
                            onConfirm: () {
                              Get.back();
                              controller.deleteSupplier(supplier.id);
                            },
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        );
      }),
    );
  }
}
