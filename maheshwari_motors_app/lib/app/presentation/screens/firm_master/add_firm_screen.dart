import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../data/models/firm_model.dart';
import '../../../data/services/api_service.dart';

class AddFirmScreen extends StatefulWidget {
  const AddFirmScreen({super.key});

  @override
  State<AddFirmScreen> createState() => _AddFirmScreenState();
}

class _AddFirmScreenState extends State<AddFirmScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _api = ApiService();
  bool _isLoading = false;
  FirmModel? _editFirm;

  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _gstinCtrl = TextEditingController();
  String _type = 'NON_GST';

  @override
  void initState() {
    super.initState();
    _editFirm = Get.arguments as FirmModel?;
    if (_editFirm != null) {
      _nameCtrl.text = _editFirm!.name;
      _phoneCtrl.text = _editFirm!.phone;
      _emailCtrl.text = _editFirm!.email;
      _addressCtrl.text = _editFirm!.address;
      _cityCtrl.text = _editFirm!.city;
      _stateCtrl.text = _editFirm!.state;
      _gstinCtrl.text = _editFirm!.gstin ?? '';
      _type = _editFirm!.type;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _gstinCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final data = {
        'name': _nameCtrl.text.trim(),
        'type': _type,
        'phone': _phoneCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'address': _addressCtrl.text.trim(),
        'city': _cityCtrl.text.trim(),
        'state': _stateCtrl.text.trim(),
      };
      if (_gstinCtrl.text.trim().isNotEmpty) {
        data['GSTIN'] = _gstinCtrl.text.trim();
      }

      if (_editFirm != null) {
        await _api.updateFirm(_editFirm!.id, data);
        AppSnackbar.success('Firm updated');
      } else {
        await _api.createFirm(data);
        AppSnackbar.success('Firm created');
      }
      Get.back(result: true);
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = _editFirm != null;
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(title: Text(isEdit ? 'Edit Firm' : 'Add Firm')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Type selector
              Text('Firm Type', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _TypeChip(
                      label: 'NON-GST',
                      selected: _type == 'NON_GST',
                      onTap: () => setState(() => _type = 'NON_GST'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _TypeChip(
                      label: 'GST',
                      selected: _type == 'GST',
                      onTap: () => setState(() => _type = 'GST'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),

              AppTextField(
                label: 'Firm Name',
                hint: 'Enter firm name',
                controller: _nameCtrl,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Phone',
                hint: 'Enter phone number',
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Email',
                hint: 'Enter email',
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Address',
                hint: 'Enter address',
                controller: _addressCtrl,
                maxLines: 2,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'City',
                      hint: 'City',
                      controller: _cityCtrl,
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: AppTextField(
                      label: 'State',
                      hint: 'State',
                      controller: _stateCtrl,
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (_type == 'GST')
                AppTextField(
                  label: 'GSTIN',
                  hint: 'Enter GSTIN',
                  controller: _gstinCtrl,
                ),
              const SizedBox(height: 32),
              AppButton(
                text: isEdit ? 'Update Firm' : 'Create Firm',
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

class _TypeChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _TypeChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: selected ? AppColors.accent : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppColors.accent : AppColors.border,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: selected ? AppColors.white : AppColors.textSecondary,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
