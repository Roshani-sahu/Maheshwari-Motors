import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../shared/widgets/common_widgets.dart';
import '../../../data/models/item_model.dart';
import '../../../data/services/api_service.dart';

class AddItemScreen extends StatefulWidget {
  const AddItemScreen({super.key});

  @override
  State<AddItemScreen> createState() => _AddItemScreenState();
}

class _AddItemScreenState extends State<AddItemScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _amountController = TextEditingController();
  final _thresholdController = TextEditingController();
  final _gstStockController = TextEditingController();
  final _nongstStockController = TextEditingController();

  final ApiService _api = ApiService();
  bool _isLoading = false;
  File? _imageFile;
  ItemModel? _editItem;

  @override
  void initState() {
    super.initState();
    _editItem = Get.arguments as ItemModel?;
    if (_editItem != null) {
      _nameController.text = _editItem!.itemName;
      _amountController.text =
          _editItem!.amount == _editItem!.amount.roundToDouble()
          ? _editItem!.amount.toInt().toString()
          : _editItem!.amount.toString();
      if (_editItem!.threshold > 0) {
        _thresholdController.text = _editItem!.threshold.toString();
      }
      if (_editItem!.gstStock > 0) {
        _gstStockController.text = _editItem!.gstStock.toString();
      }
      if (_editItem!.nongstStock > 0) {
        _nongstStockController.text = _editItem!.nongstStock.toString();
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _amountController.dispose();
    _thresholdController.dispose();
    _gstStockController.dispose();
    _nongstStockController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      imageQuality: 80,
    );
    if (picked != null) {
      setState(() => _imageFile = File(picked.path));
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final data = {
        'item_name': _nameController.text.trim(),
        'amount': double.parse(_amountController.text.trim()),
        'threshold': int.parse(
          _thresholdController.text.trim().isEmpty
              ? '0'
              : _thresholdController.text.trim(),
        ),
        'gst_stock': int.parse(
          _gstStockController.text.trim().isEmpty
              ? '0'
              : _gstStockController.text.trim(),
        ),
        'nongst_stock': int.parse(
          _nongstStockController.text.trim().isEmpty
              ? '0'
              : _nongstStockController.text.trim(),
        ),
      };

      if (_editItem != null) {
        await _api.updateItem(_editItem!.id, data, imagePath: _imageFile?.path);
        AppSnackbar.success('Item updated');
      } else {
        await _api.createItem(data, imagePath: _imageFile?.path);
        AppSnackbar.success('Item created');
      }
      Get.back(result: true);
    } catch (e) {
      AppSnackbar.error(ApiClient.parseError(e));
    }
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = _editItem != null;
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(title: Text(isEdit ? 'Edit Item' : 'Add Item')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image picker
              Center(
                child: GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppColors.border,
                        style: BorderStyle.solid,
                      ),
                      image: _imageFile != null
                          ? DecorationImage(
                              image: FileImage(_imageFile!),
                              fit: BoxFit.cover,
                            )
                          : _editItem?.image != null
                          ? DecorationImage(
                              image: NetworkImage(_editItem!.image!),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: _imageFile == null && _editItem?.image == null
                        ? Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.camera_alt_outlined,
                                color: AppColors.textSecondary,
                                size: 28,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Add Photo',
                                style: Theme.of(
                                  context,
                                ).textTheme.bodySmall?.copyWith(fontSize: 11),
                              ),
                            ],
                          )
                        : null,
                  ),
                ),
              ),
              const SizedBox(height: 28),

              AppTextField(
                label: 'Item Name',
                hint: 'Enter item name',
                controller: _nameController,
                validator: (v) => v == null || v.trim().isEmpty
                    ? 'Item name is required'
                    : null,
              ),
              const SizedBox(height: 18),

              AppTextField(
                label: 'Amount (₹)',
                hint: 'Enter price',
                controller: _amountController,
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'Amount is required';
                  }
                  if (double.tryParse(v.trim()) == null) {
                    return 'Invalid amount';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 18),

              AppTextField(
                label: 'Low Stock Threshold',
                hint: 'e.g., 10',
                controller: _thresholdController,
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v != null &&
                      v.trim().isNotEmpty &&
                      int.tryParse(v.trim()) == null) {
                    return 'Enter a valid number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 18),

              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'GST Stock',
                      hint: '0',
                      controller: _gstStockController,
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v != null &&
                            v.trim().isNotEmpty &&
                            int.tryParse(v.trim()) == null) {
                          return 'Invalid';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: AppTextField(
                      label: 'Non-GST Stock',
                      hint: '0',
                      controller: _nongstStockController,
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v != null &&
                            v.trim().isNotEmpty &&
                            int.tryParse(v.trim()) == null) {
                          return 'Invalid';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              AppButton(
                text: isEdit ? 'Update Item' : 'Create Item',
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
