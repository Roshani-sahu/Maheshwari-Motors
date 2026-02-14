import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/category_model.dart';
import '../../../data/models/discount_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';

class DiscountMasterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<CategoryModel> categories = <CategoryModel>[].obs;
  final RxList<DiscountModel> discounts = <DiscountModel>[].obs;
  final Rx<CategoryModel?> selectedCategory = Rx<CategoryModel?>(null);
  final RxBool isLoadingCategories = true.obs;
  final RxBool isLoadingDiscounts = false.obs;
  final RxBool isSaving = false.obs;

  final RxMap<String, TextEditingController> d1NormalCtrls =
      <String, TextEditingController>{}.obs;
  final RxMap<String, TextEditingController> d1SpecialCtrls =
      <String, TextEditingController>{}.obs;
  final RxMap<String, TextEditingController> d2NormalCtrls =
      <String, TextEditingController>{}.obs;
  final RxMap<String, TextEditingController> d2SpecialCtrls =
      <String, TextEditingController>{}.obs;

  @override
  void onInit() {
    super.onInit();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    isLoadingCategories.value = true;
    try {
      categories.value = await _api.getCategories();
      if (categories.isNotEmpty) {
        selectCategory(categories.first);
      }
    } catch (e) {
      AppSnackbar.error('Failed to load categories');
    }
    isLoadingCategories.value = false;
  }

  Future<void> selectCategory(CategoryModel category) async {
    selectedCategory.value = category;
    isLoadingDiscounts.value = true;
    _disposeControllers();

    try {
      discounts.value = await _api.getDiscounts(categoryId: category.id);
      for (final d in discounts) {
        final brandId = d.brandId;
        d1NormalCtrls[brandId] = TextEditingController(
          text: d.discount1.normal > 0 ? '${d.discount1.normal}' : '',
        );
        d1SpecialCtrls[brandId] = TextEditingController(
          text: d.discount1.special > 0 ? '${d.discount1.special}' : '',
        );
        d2NormalCtrls[brandId] = TextEditingController(
          text: d.discount2.normal > 0 ? '${d.discount2.normal}' : '',
        );
        d2SpecialCtrls[brandId] = TextEditingController(
          text: d.discount2.special > 0 ? '${d.discount2.special}' : '',
        );
      }
    } catch (e) {
      AppSnackbar.error('Failed to load discounts');
    }
    isLoadingDiscounts.value = false;
  }

  Future<void> saveChanges() async {
    isSaving.value = true;
    try {
      for (final d in discounts) {
        final brandId = d.brandId;
        final data = <String, dynamic>{
          'brand_id': brandId,
          'discount1': {
            'normal': double.tryParse(d1NormalCtrls[brandId]?.text ?? '') ?? 0,
            'special':
                double.tryParse(d1SpecialCtrls[brandId]?.text ?? '') ?? 0,
          },
          'discount2': {
            'normal': double.tryParse(d2NormalCtrls[brandId]?.text ?? '') ?? 0,
            'special':
                double.tryParse(d2SpecialCtrls[brandId]?.text ?? '') ?? 0,
          },
        };
        await _api.upsertDiscount(data);
      }
      AppSnackbar.success('Discounts saved');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
    isSaving.value = false;
  }

  void _disposeControllers() {
    for (final c in d1NormalCtrls.values) {
      c.dispose();
    }
    for (final c in d1SpecialCtrls.values) {
      c.dispose();
    }
    for (final c in d2NormalCtrls.values) {
      c.dispose();
    }
    for (final c in d2SpecialCtrls.values) {
      c.dispose();
    }
    d1NormalCtrls.clear();
    d1SpecialCtrls.clear();
    d2NormalCtrls.clear();
    d2SpecialCtrls.clear();
  }

  @override
  void onClose() {
    _disposeControllers();
    super.onClose();
  }
}
