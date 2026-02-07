import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../data/models/user_model.dart';
import '../../../data/services/api_service.dart';

class AddUserScreen extends StatefulWidget {
  const AddUserScreen({super.key});

  @override
  State<AddUserScreen> createState() => _AddUserScreenState();
}

class _AddUserScreenState extends State<AddUserScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _api = ApiService();
  bool _isLoading = false;
  bool _obscure = true;
  UserModel? _editUser;

  final _usernameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _editUser = Get.arguments as UserModel?;
    if (_editUser != null) {
      _usernameCtrl.text = _editUser!.username;
      _emailCtrl.text = _editUser!.email;
    }
  }

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final data = <String, dynamic>{
        'username': _usernameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
      };
      if (_passwordCtrl.text.isNotEmpty) {
        data['password'] = _passwordCtrl.text;
      }

      if (_editUser != null) {
        await _api.updateUser(_editUser!.id, data);
        AppSnackbar.success('User updated');
      } else {
        data['password'] = _passwordCtrl.text;
        data['type'] = 'secondary';
        await _api.createUser(data);
        AppSnackbar.success('User created');
      }
      Get.back(result: true);
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = _editUser != null;
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(title: Text(isEdit ? 'Edit User' : 'Add User')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Avatar
              CircleAvatar(
                radius: 40,
                backgroundColor: AppColors.accentLight,
                child: Icon(
                  Icons.person_outline,
                  size: 36,
                  color: AppColors.accent,
                ),
              ),
              const SizedBox(height: 28),

              AppTextField(
                label: 'Username',
                hint: 'Enter username',
                controller: _usernameCtrl,
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
                label: isEdit ? 'New Password (optional)' : 'Password',
                hint: 'Enter password',
                controller: _passwordCtrl,
                obscureText: _obscure,
                suffixIcon: GestureDetector(
                  onTap: () => setState(() => _obscure = !_obscure),
                  child: Icon(
                    _obscure
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 20,
                    color: AppColors.textSecondary,
                  ),
                ),
                validator: isEdit
                    ? null
                    : (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 32),
              AppButton(
                text: isEdit ? 'Update User' : 'Create User',
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
