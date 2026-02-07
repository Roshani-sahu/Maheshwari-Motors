import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../controllers/auth_controller.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../data/models/party_model.dart';
import '../../../data/services/api_service.dart';

class AddPartyScreen extends StatefulWidget {
  const AddPartyScreen({super.key});

  @override
  State<AddPartyScreen> createState() => _AddPartyScreenState();
}

class _AddPartyScreenState extends State<AddPartyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _api = ApiService();
  final _auth = Get.find<AuthController>();

  late final TextEditingController _nameC;
  late final TextEditingController _contactC;
  late final TextEditingController _emailC;
  late final TextEditingController _addressC;
  late final TextEditingController _cityC;
  late final TextEditingController _stateC;
  late final TextEditingController _gstinC;

  PartyModel? _editParty;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _editParty = Get.arguments as PartyModel?;
    _nameC = TextEditingController(text: _editParty?.name ?? '');
    _contactC = TextEditingController(text: _editParty?.phone ?? '');
    _emailC = TextEditingController(text: _editParty?.email ?? '');
    _addressC = TextEditingController(text: _editParty?.address ?? '');
    _cityC = TextEditingController(text: _editParty?.city ?? '');
    _stateC = TextEditingController(text: _editParty?.state ?? '');
    _gstinC = TextEditingController(text: _editParty?.gstin ?? '');
  }

  @override
  void dispose() {
    _nameC.dispose();
    _contactC.dispose();
    _emailC.dispose();
    _addressC.dispose();
    _cityC.dispose();
    _stateC.dispose();
    _gstinC.dispose();
    super.dispose();
  }

  bool get isEdit => _editParty != null;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final data = <String, dynamic>{
        'name': _nameC.text.trim(),
        'city': _cityC.text.trim(),
        'state': _stateC.text.trim(),
      };
      final phone = _contactC.text.trim();
      final email = _emailC.text.trim();
      final address = _addressC.text.trim();
      final gstin = _gstinC.text.trim();
      if (phone.isNotEmpty) data['phone'] = phone;
      if (email.isNotEmpty) data['email'] = email;
      if (address.isNotEmpty) data['address'] = address;
      if (gstin.isNotEmpty) data['gstin'] = gstin;
      final firmId = _auth.firmId;
      if (isEdit) {
        await _api.updateParty(firmId, _editParty!.id, data);
        AppSnackbar.success('Party updated');
      } else {
        await _api.createParty(firmId, data);
        AppSnackbar.success('Party created');
      }
      Get.back(result: true);
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(isEdit ? 'Edit Party' : 'Add Party')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar preview
              Center(
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.accentLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Center(
                    child: Text(
                      _nameC.text.isNotEmpty
                          ? _nameC.text[0].toUpperCase()
                          : 'P',
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(
                            color: AppColors.accent,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 28),

              AppTextField(
                label: 'Party Name *',
                controller: _nameC,
                hint: 'Enter party name',
                onChanged: (_) => setState(() {}),
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'Name is required' : null,
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'Contact',
                      controller: _contactC,
                      hint: 'Phone number',
                      keyboardType: TextInputType.phone,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      label: 'Email',
                      controller: _emailC,
                      hint: 'email@example.com',
                      keyboardType: TextInputType.emailAddress,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              AppTextField(
                label: 'Address',
                controller: _addressC,
                hint: 'Street address',
                maxLines: 2,
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'City',
                      controller: _cityC,
                      hint: 'City',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      label: 'State',
                      controller: _stateC,
                      hint: 'State',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              AppTextField(
                label: 'GSTIN',
                controller: _gstinC,
                hint: 'GST Number (optional)',
              ),
              const SizedBox(height: 32),

              AppButton(
                text: isEdit ? 'Update Party' : 'Create Party',
                isLoading: _isLoading,
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
