import 'package:get/get.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/discount_model.dart';
import '../../../data/services/api_service.dart';
import '../../shared/widgets/common_widgets.dart';

class DiscountMasterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final RxList<DiscountModel> discounts = <DiscountModel>[].obs;
  final RxList<DiscountModel> filtered = <DiscountModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString typeFilter = 'all'.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadDiscounts();
    ever(typeFilter, (_) => _filter());
  }

  Future<void> loadDiscounts() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      discounts.value = await _api.getDiscounts();
      _filter();
    } catch (e) {
      errorMessage.value = 'Unable to load discount rules';
    }
    isLoading.value = false;
  }

  void _filter() {
    if (typeFilter.value == 'all') {
      filtered.value = discounts;
    } else {
      filtered.value = discounts
          .where((d) => d.type == typeFilter.value)
          .toList();
    }
  }

  Future<void> deleteDiscount(String id) async {
    try {
      await _api.deleteDiscount(id);
      discounts.removeWhere((d) => d.id == id);
      _filter();
      AppSnackbar.success('Discount rule removed');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}
