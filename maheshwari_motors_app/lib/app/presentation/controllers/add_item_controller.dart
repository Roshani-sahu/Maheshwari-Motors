import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/network/api_client.dart';
import '../../data/models/item_model.dart';
import '../../data/models/category_model.dart';
import '../../data/models/supplier_model.dart';
import '../../data/services/api_service.dart';
import '../shared/widgets/common_widgets.dart';

class AddItemController extends GetxController {
  final formKey = GlobalKey<FormState>();
  final nameController = TextEditingController();
  final amountController = TextEditingController();
  final thresholdController = TextEditingController();
  final gstStockController = TextEditingController();
  final nongstStockController = TextEditingController();

  final ApiService _api = Get.find<ApiService>();
  final RxBool isLoading = false.obs;
  final Rx<XFile?> imageFile = Rx<XFile?>(null);

  final RxList<CategoryModel> categoryList = <CategoryModel>[].obs;
  final RxList<SupplierModel> supplierList = <SupplierModel>[].obs;
  final RxList<String> selectedCategoryIds = <String>[].obs;
  final Rx<String?> selectedSupplierId = Rx<String?>(null);

  ItemModel? editItem;
  bool get isEdit => editItem != null;

  @override
  void onInit() {
    super.onInit();
    fetchDropdowns();
    editItem = Get.arguments as ItemModel?;
    if (editItem != null) {
      nameController.text = editItem!.itemName;
      amountController.text =
          editItem!.amount == editItem!.amount.roundToDouble()
          ? editItem!.amount.toInt().toString()
          : editItem!.amount.toString();
      if (editItem!.threshold > 0) {
        thresholdController.text = editItem!.threshold.toString();
      }
      if (editItem!.gstStock > 0) {
        gstStockController.text = editItem!.gstStock.toString();
      }
      if (editItem!.nongstStock > 0) {
        nongstStockController.text = editItem!.nongstStock.toString();
      }
      selectedCategoryIds.assignAll(editItem!.categoryIds);
      selectedSupplierId.value = editItem!.supplierId;
    }
  }

  Future<void> fetchDropdowns() async {
    try {
      final cats = await _api.getCategories();
      categoryList.assignAll(cats);
      final sups = await _api.getSuppliers();
      supplierList.assignAll(sups);
    } catch (e) {
      debugPrint('Error fetching dropdowns: $e');
    }
  }

  Future<void> pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      imageQuality: 80,
    );
    if (picked != null) {
      imageFile.value = picked;
    }
  }

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    isLoading.value = true;

    try {
      final data = {
        'item_name': nameController.text.trim(),
        'amount': double.parse(amountController.text.trim()),
        'threshold': int.parse(
          thresholdController.text.trim().isEmpty
              ? '0'
              : thresholdController.text.trim(),
        ),
        'gst_stock': int.parse(
          gstStockController.text.trim().isEmpty
              ? '0'
              : gstStockController.text.trim(),
        ),
        'nongst_stock': int.parse(
          nongstStockController.text.trim().isEmpty
              ? '0'
              : nongstStockController.text.trim(),
        ),
        'category_ids': selectedCategoryIds,
        'supplier_id': selectedSupplierId.value,
      };

      if (isEdit) {
        await _api.updateItem(
          editItem!.id,
          data,
          imagePath: imageFile.value?.path,
        );
        AppSnackbar.success('Item updated');
      } else {
        await _api.createItem(data, imagePath: imageFile.value?.path);
        AppSnackbar.success('Item created');
      }
      Get.back(result: true);
      return;
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
    isLoading.value = false;
  }

  @override
  void onClose() {
    nameController.dispose();
    amountController.dispose();
    thresholdController.dispose();
    gstStockController.dispose();
    nongstStockController.dispose();
    super.onClose();
  }
}
