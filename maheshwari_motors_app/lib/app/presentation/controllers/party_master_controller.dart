import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/party_model.dart';
import '../../data/services/api_service.dart';
import '../shared/widgets/common_widgets.dart';
import 'auth_controller.dart';

class PartyMasterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final AuthController _auth = Get.find<AuthController>();

  final RxList<PartyModel> parties = <PartyModel>[].obs;
  final RxList<PartyModel> filtered = <PartyModel>[].obs;
  final RxBool isLoading = true.obs;
  final RxString searchQuery = ''.obs;
  final RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadParties();
    debounce(
      searchQuery,
      (_) => _filter(),
      time: const Duration(milliseconds: 300),
    );
  }

  Future<void> loadParties() async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final firmId = _auth.firmId;
      if (firmId.isNotEmpty) {
        parties.value = await _api.getParties(firmId);
        _filter();
      }
    } catch (e) {
      errorMessage.value = 'Failed to load parties';
    }
    isLoading.value = false;
  }

  void _filter() {
    if (searchQuery.value.isEmpty) {
      filtered.value = parties;
    } else {
      final q = searchQuery.value.toLowerCase();
      filtered.value = parties
          .where(
            (p) =>
                p.name.toLowerCase().contains(q) ||
                (p.phone?.toLowerCase().contains(q) ?? false),
          )
          .toList();
    }
  }

  Future<void> deleteParty(String id) async {
    try {
      await _api.deleteParty(_auth.firmId, id);
      parties.removeWhere((p) => p.id == id);
      _filter();
      AppSnackbar.success('Party deleted');
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
  }
}
