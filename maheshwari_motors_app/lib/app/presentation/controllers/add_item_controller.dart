import 'package:dio/dio.dart';
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
  final RxInt isGst = 1.obs; // 1 = can sell as GST, 0 = NON_GST only

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
      isGst.value = editItem!.isGst;
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
      final data = <String, dynamic>{
        'item_name': nameController.text.trim(),
        'amount': amountController.text.trim(),
        'threshold': thresholdController.text.trim().isEmpty
            ? '0'
            : thresholdController.text.trim(),
        'gst_stock': gstStockController.text.trim().isEmpty
            ? '0'
            : gstStockController.text.trim(),
        'nongst_stock': nongstStockController.text.trim().isEmpty
            ? '0'
            : nongstStockController.text.trim(),
        'is_gst': isGst.value,
      };

      // Send category_ids as individual entries so FormData serializes
      // them as repeated fields that Express/multer parses into an array.
      final validCatIds = selectedCategoryIds
          .where((id) => id.isNotEmpty)
          .toList();
      if (validCatIds.isNotEmpty) {
        data['category_ids'] = validCatIds;
      }

      // Only include supplier_id when actually selected and non-empty —
      // sending null or "" causes mongoose to fail casting to ObjectId.
      final suppId = selectedSupplierId.value;
      if (suppId != null && suppId.isNotEmpty) {
        data['supplier_id'] = suppId;
      }

      debugPrint('[AddItem] payload: $data');

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
    } catch (e) {
      debugPrint('[AddItem] error: $e');
      if (e is DioException) {
        debugPrint('[AddItem] response: ${e.response?.data}');
      }
      AppSnackbar.error(ApiClient.parseError(e));
    } finally {
      isLoading.value = false;
    }
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
