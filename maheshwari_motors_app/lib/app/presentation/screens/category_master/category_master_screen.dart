import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../routes/app_routes.dart';
import '../../controllers/category_master_controller.dart';
import '../../shared/widgets/common_widgets.dart';

class CategoryMasterScreen extends GetView<CategoryMasterController> {
  const CategoryMasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Categories'),
        actions: [
          AppBarAddButton(onPressed: () => Get.toNamed(AppRoutes.addCategory)),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }
        if (controller.categories.isEmpty) {
          return const EmptyState(
            icon: Icons.category,
            title: 'No categories found',
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: controller.categories.length,
          itemBuilder: (context, index) {
            final category = controller.categories[index];
            return Card(
              child: ListTile(
                title: Text(category.name),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ActionIcon(
                      icon: Icons.edit,
                      color: Colors.blue,
                      onTap: () => Get.toNamed(
                        AppRoutes.editCategory,
                        arguments: category,
                      ),
                    ),
                    const SizedBox(width: 8),
                    ActionIcon(
                      icon: Icons.delete,
                      color: Colors.red,
                      onTap: () {
                        Get.bottomSheet(
                          DeleteConfirmSheet(
                            title: 'Delete Category?',
                            subtitle: 'This action cannot be undone.',
                            onConfirm: () {
                              Get.back();
                              controller.deleteCategory(category.id);
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
