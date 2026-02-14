import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/item_model.dart';
import '../../../data/models/brand_model.dart';
import '../../../data/models/category_model.dart';
import '../../../data/models/supplier_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';

class AddItemController extends GetxController {
  final formKey = GlobalKey<FormState>();
  final nameController = TextEditingController();
  final saleRateController = TextEditingController();
  final purchaseRateController = TextEditingController();
  final mrpRateController = TextEditingController();
  final gstPercentController = TextEditingController();
  final discountController = TextEditingController();
  final stockController = TextEditingController();
  final thresholdController = TextEditingController();

  final ApiService _api = Get.find<ApiService>();
  final RxBool isLoading = false.obs;
  final Rx<XFile?> imageFile = Rx<XFile?>(null);

  final RxList<CategoryModel> categoryList = <CategoryModel>[].obs;
  final RxList<BrandModel> brandList = <BrandModel>[].obs;
  final RxList<SupplierModel> supplierList = <SupplierModel>[].obs;
  final Rx<String?> selectedCategoryId = Rx<String?>(null);
  final Rx<String?> selectedBrandId = Rx<String?>(null);
  final Rx<String?> selectedSupplierId = Rx<String?>(null);
  final RxInt isGst = 1.obs;

  ItemModel? editItem;
  bool get isEdit => editItem != null;

  @override
  void onInit() {
    super.onInit();
    fetchDropdowns();
    editItem = Get.arguments as ItemModel?;
    if (editItem != null) {
      nameController.text = editItem!.itemName;
      saleRateController.text =
          editItem!.saleRate == editItem!.saleRate.roundToDouble()
          ? editItem!.saleRate.toInt().toString()
          : editItem!.saleRate.toString();
      if (editItem!.purchaseRate > 0) {
        purchaseRateController.text =
            editItem!.purchaseRate == editItem!.purchaseRate.roundToDouble()
            ? editItem!.purchaseRate.toInt().toString()
            : editItem!.purchaseRate.toString();
      }
      if (editItem!.mrpRate > 0) {
        mrpRateController.text =
            editItem!.mrpRate == editItem!.mrpRate.roundToDouble()
            ? editItem!.mrpRate.toInt().toString()
            : editItem!.mrpRate.toString();
      }
      if (editItem!.gstPercent > 0) {
        gstPercentController.text = editItem!.gstPercent.toString();
      }
      if (editItem!.discount > 0) {
        discountController.text = editItem!.discount.toString();
      }
      if (editItem!.stock > 0) {
        stockController.text = editItem!.stock.toString();
      }
      if (editItem!.threshold > 0) {
        thresholdController.text = editItem!.threshold.toString();
      }
      selectedCategoryId.value = editItem!.categoryId;
      selectedBrandId.value = editItem!.brandId;
      selectedSupplierId.value = editItem!.supplierId;
      isGst.value = editItem!.isGst;
    }
  }

  Future<void> fetchDropdowns() async {
    try {
      final results = await Future.wait([
        _api.getCategories(),
        _api.getBrands(),
        _api.getSuppliers(),
      ]);
      categoryList.assignAll(results[0] as List<CategoryModel>);
      brandList.assignAll(results[1] as List<BrandModel>);
      supplierList.assignAll(results[2] as List<SupplierModel>);
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
        'sale_rate': saleRateController.text.trim(),
        'purchase_rate': purchaseRateController.text.trim().isEmpty
            ? '0'
            : purchaseRateController.text.trim(),
        'mrp_rate': mrpRateController.text.trim().isEmpty
            ? '0'
            : mrpRateController.text.trim(),
        'gst_percent': gstPercentController.text.trim().isEmpty
            ? '0'
            : gstPercentController.text.trim(),
        'discount': discountController.text.trim().isEmpty
            ? '0'
            : discountController.text.trim(),
        'stock': stockController.text.trim().isEmpty
            ? '0'
            : stockController.text.trim(),
        'threshold': thresholdController.text.trim().isEmpty
            ? '0'
            : thresholdController.text.trim(),
        'is_gst': isGst.value,
      };

      final catId = selectedCategoryId.value;
      if (catId != null && catId.isNotEmpty) {
        data['category_id'] = catId;
      }

      final brandId = selectedBrandId.value;
      if (brandId != null && brandId.isNotEmpty) {
        data['brand_id'] = brandId;
      }

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
    saleRateController.dispose();
    purchaseRateController.dispose();
    mrpRateController.dispose();
    gstPercentController.dispose();
    discountController.dispose();
    stockController.dispose();
    thresholdController.dispose();
    super.onClose();
  }
}
