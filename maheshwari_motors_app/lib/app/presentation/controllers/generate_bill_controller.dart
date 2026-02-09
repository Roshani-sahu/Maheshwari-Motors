import 'package:get/get.dart';

import '../../core/network/api_client.dart';
import '../../data/models/challan_model.dart';
import '../../data/models/party_model.dart';
import '../../data/services/api_service.dart';
import '../shared/widgets/common_widgets.dart';
import 'auth_controller.dart';

class GenerateBillController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final AuthController _auth = Get.find<AuthController>();

  final RxBool isLoading = false.obs;
  final RxBool isLoadingParties = true.obs;
  final RxBool isLoadingChallans = false.obs;

  final RxList<PartyModel> parties = <PartyModel>[].obs;
  final Rx<PartyModel?> selectedParty = Rx<PartyModel?>(null);

  final RxList<ChallanModel> challans = <ChallanModel>[].obs;
  final RxSet<String> selectedChallanIds = <String>{}.obs;

  final RxBool applyBalance = false.obs;

  // Computed
  double get totalAmount {
    double sum = 0;
    for (final ch in challans) {
      if (selectedChallanIds.contains(ch.id)) {
        sum += ch.amount;
      }
    }
    return sum;
  }

  double get partyBalance => selectedParty.value?.balance ?? 0;

  double get finalAmount {
    double amt = totalAmount;
    if (applyBalance.value && partyBalance != 0) {
      amt -= partyBalance;
    }
    return amt;
  }

  @override
  void onInit() {
    super.onInit();
    _loadParties();
  }

  Future<void> _loadParties() async {
    try {
      parties.value = await _api.getParties(_auth.firmId);
    } catch (e) {
      AppSnackbar.error('Failed to load parties');
    }
    isLoadingParties.value = false;
  }

  Future<void> onPartySelected(PartyModel? party) async {
    selectedParty.value = party;
    selectedChallanIds.clear();
    challans.clear();

    if (party == null) return;

    isLoadingChallans.value = true;
    try {
      challans.value = await _api.getUnconvertedChallans(
        _auth.firmId,
        party.id,
      );
    } catch (e) {
      AppSnackbar.error('Failed to load challans');
    }
    isLoadingChallans.value = false;
  }

  void toggleChallan(String id) {
    if (selectedChallanIds.contains(id)) {
      selectedChallanIds.remove(id);
    } else {
      selectedChallanIds.add(id);
    }
  }

  void selectAll() {
    if (selectedChallanIds.length == challans.length) {
      selectedChallanIds.clear();
    } else {
      selectedChallanIds.assignAll(challans.map((c) => c.id));
    }
  }

  Future<void> submit() async {
    if (selectedParty.value == null) {
      AppSnackbar.error('Please select a party');
      return;
    }
    if (selectedChallanIds.isEmpty) {
      AppSnackbar.error('Select at least one challan');
      return;
    }

    isLoading.value = true;
    try {
      final data = <String, dynamic>{
        'party_id': selectedParty.value!.id,
        'challan_ids': selectedChallanIds.toList(),
        'apply_balance': applyBalance.value,
      };
      await _api.createBill(_auth.firmId, data);
      AppSnackbar.success('Bill generated successfully');
      Get.back(result: true);
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
    isLoading.value = false;
  }
}
