import 'package:get/get.dart' hide FormData, MultipartFile;
import 'package:dio/dio.dart' as dio;

import '../../core/network/api_client.dart';
import '../models/user_model.dart';
import '../models/item_model.dart';
import '../models/party_model.dart';
import '../models/challan_model.dart';
import '../models/bill_model.dart';
import '../models/transaction_model.dart';
import '../models/stock_alert_model.dart';
import '../models/category_model.dart';
import '../models/supplier_model.dart';
import '../models/purchase_model.dart';
import '../models/discount_model.dart';

class ApiService {
  final ApiClient _client = Get.find<ApiClient>();

  Future<Map<String, dynamic>> login(
    String username,
    String password, {
    String? deviceName,
    String? deviceType,
  }) async {
    final res = await _client.post(
      '/auth/login',
      data: {
        'username': username,
        'password': password,
        'device_name': ?deviceName,
        'device_type': ?deviceType,
      },
    );
    return res.data;
  }

  Future<void> logout() async {
    await _client.post('/auth/logout');
    await _client.clearToken();
  }

  Future<UserModel> getProfile() async {
    final res = await _client.get('/auth/me');
    return UserModel.fromJson(res.data['data']);
  }

  Future<void> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    await _client.put(
      '/auth/change-password',
      data: {'current_password': currentPassword, 'new_password': newPassword},
    );
  }

  Future<List<Map<String, dynamic>>> getSessions() async {
    final res = await _client.get('/auth/sessions');
    final data = res.data['data'] as List;
    return data.cast<Map<String, dynamic>>();
  }

  Future<void> revokeSession(String sessionId) async {
    await _client.delete('/auth/sessions/$sessionId');
  }

  Future<void> revokeAllOtherSessions() async {
    await _client.delete('/auth/sessions');
  }

  Future<List<ItemModel>> getItems() async {
    final res = await _client.get('/items');
    final data = res.data['data']['data'] as List;
    return data.map((e) => ItemModel.fromJson(e)).toList();
  }

  Future<ItemModel> getItemById(String id) async {
    final res = await _client.get('/items/$id');
    return ItemModel.fromJson(res.data['data']);
  }

  Future<ItemModel> createItem(
    Map<String, dynamic> data, {
    String? imagePath,
  }) async {
    dio.FormData formData;
    if (imagePath != null) {
      formData = dio.FormData.fromMap({
        ...data,
        'image': await dio.MultipartFile.fromFile(imagePath),
      });
    } else {
      formData = dio.FormData.fromMap(data);
    }
    final res = await _client.postMultipart('/items', formData: formData);
    return ItemModel.fromJson(res.data['data']);
  }

  Future<ItemModel> updateItem(
    String id,
    Map<String, dynamic> data, {
    String? imagePath,
  }) async {
    dio.FormData formData;
    if (imagePath != null) {
      formData = dio.FormData.fromMap({
        ...data,
        'image': await dio.MultipartFile.fromFile(imagePath),
      });
    } else {
      formData = dio.FormData.fromMap(data);
    }
    final res = await _client.putMultipart('/items/$id', formData: formData);
    return ItemModel.fromJson(res.data['data']);
  }

  Future<void> deleteItem(String id) async {
    await _client.delete('/items/$id');
  }

  Future<List<ItemModel>> getLowStockItems() async {
    final res = await _client.get('/items/low-stock');
    final data = res.data['data'] as List;
    return data.map((e) => ItemModel.fromJson(e)).toList();
  }

  Future<List<PartyModel>> getParties() async {
    final res = await _client.get('/parties');
    final data = res.data['data']['data'] as List;
    return data.map((e) => PartyModel.fromJson(e)).toList();
  }

  Future<PartyModel> createParty(Map<String, dynamic> data) async {
    final res = await _client.post('/parties', data: data);
    return PartyModel.fromJson(res.data['data']);
  }

  Future<PartyModel> updateParty(
    String partyId,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.put('/parties/$partyId', data: data);
    return PartyModel.fromJson(res.data['data']);
  }

  Future<void> deleteParty(String partyId) async {
    await _client.delete('/parties/$partyId');
  }

  Future<List<ChallanModel>> getChallans() async {
    final res = await _client.get('/challans');
    final data = res.data['data']['data'] as List;
    return data.map((e) => ChallanModel.fromJson(e)).toList();
  }

  Future<ChallanModel> getChallanById(String id) async {
    final res = await _client.get('/challans/$id');
    return ChallanModel.fromJson(res.data['data']);
  }

  Future<ChallanModel> createChallan(Map<String, dynamic> data) async {
    final res = await _client.post('/challans', data: data);
    return ChallanModel.fromJson(res.data['data']);
  }

  Future<ChallanModel> updateChallan(
    String id,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.put('/challans/$id', data: data);
    return ChallanModel.fromJson(res.data['data']);
  }

  Future<void> deleteChallan(String id) async {
    await _client.delete('/challans/$id');
  }

  Future<List<ChallanModel>> getUnconvertedChallans(String partyId) async {
    final res = await _client.get('/challans/party/$partyId/unconverted');
    final data = res.data['data'] as List;
    return data.map((e) => ChallanModel.fromJson(e)).toList();
  }

  Future<List<BillModel>> getBills() async {
    final res = await _client.get('/bills');
    final data = res.data['data']['data'] as List;
    return data.map((e) => BillModel.fromJson(e)).toList();
  }

  Future<BillModel> getBillById(String id) async {
    final res = await _client.get('/bills/$id');
    return BillModel.fromJson(res.data['data']);
  }

  Future<BillModel> createBill(Map<String, dynamic> data) async {
    final res = await _client.post('/bills', data: data);
    return BillModel.fromJson(res.data['data']);
  }

  Future<BillModel> updateBill(String id, Map<String, dynamic> data) async {
    final res = await _client.put('/bills/$id', data: data);
    return BillModel.fromJson(res.data['data']);
  }

  Future<void> deleteBill(String id) async {
    await _client.delete('/bills/$id');
  }

  Future<void> recordPayment(String billId, Map<String, dynamic> data) async {
    await _client.post('/bills/$billId/payment', data: data);
  }

  Future<void> recordBillReturn(
    String billId,
    Map<String, dynamic> data,
  ) async {
    await _client.post('/bills/$billId/return', data: data);
  }

  Future<List<TransactionModel>> getTransactions() async {
    final res = await _client.get('/transactions');
    final data = res.data['data']['data'] as List;
    return data.map((e) => TransactionModel.fromJson(e)).toList();
  }

  Future<Map<String, dynamic>> getTransactionSummary() async {
    final res = await _client.get('/transactions/summary');
    return res.data['data'];
  }

  Future<TransactionModel> createSaleTransaction(
    Map<String, dynamic> data,
  ) async {
    final res = await _client.post('/transactions/sale', data: data);
    return TransactionModel.fromJson(res.data['data']);
  }

  Future<TransactionModel> createPurchaseTransaction(
    Map<String, dynamic> data,
  ) async {
    final res = await _client.post('/transactions/purchase', data: data);
    return TransactionModel.fromJson(res.data['data']);
  }

  Future<List<PurchaseModel>> getPurchases() async {
    final res = await _client.get('/purchases');
    final data = res.data['data']['data'] as List;
    return data.map((e) => PurchaseModel.fromJson(e)).toList();
  }

  Future<PurchaseModel> createPurchase(Map<String, dynamic> data) async {
    final res = await _client.post('/purchases', data: data);
    return PurchaseModel.fromJson(res.data['data']);
  }

  Future<void> deletePurchase(String id) async {
    await _client.delete('/purchases/$id');
  }

  Future<List<StockAlertModel>> getStockAlerts() async {
    final res = await _client.get('/stock-alerts');
    final data = res.data['data']['data'] as List;
    return data.map((e) => StockAlertModel.fromJson(e)).toList();
  }

  Future<int> getStockAlertCount() async {
    final res = await _client.get('/stock-alerts/count');
    return res.data['data']['count'] ?? 0;
  }

  Future<void> resolveStockAlert(String id) async {
    await _client.patch('/stock-alerts/$id/resolve');
  }

  Future<List<UserModel>> getUsers() async {
    final res = await _client.get('/admin/users');
    final data = res.data['data']['data'] as List;
    return data.map((e) => UserModel.fromJson(e)).toList();
  }

  Future<UserModel> createUser(Map<String, dynamic> data) async {
    final res = await _client.post('/admin/users', data: data);
    return UserModel.fromJson(res.data['data']);
  }

  Future<UserModel> updateUser(String id, Map<String, dynamic> data) async {
    final res = await _client.put('/admin/users/$id', data: data);
    return UserModel.fromJson(res.data['data']);
  }

  Future<void> deleteUser(String id) async {
    await _client.delete('/admin/users/$id');
  }

  Future<void> deactivateUser(String id) async {
    await _client.patch('/admin/users/$id/deactivate');
  }

  Future<void> reactivateUser(String id) async {
    await _client.patch('/admin/users/$id/reactivate');
  }

  Future<Map<String, dynamic>> getFirmDashboard({
    String period = 'monthly',
  }) async {
    final res = await _client.get(
      '/dashboard/firm',
      queryParameters: {'period': period},
    );
    return res.data['data'] ?? {};
  }

  Future<Map<String, dynamic>> getAdminDashboard() async {
    final res = await _client.get('/dashboard');
    return res.data['data'] ?? {};
  }

  Future<List<CategoryModel>> getCategories({String? search}) async {
    final res = await _client.get(
      '/categories',
      queryParameters: {'search': search, 'limit': 1000},
    );
    final data = res.data['data']['data'] as List;
    return data.map((e) => CategoryModel.fromJson(e)).toList();
  }

  Future<CategoryModel> createCategory(Map<String, dynamic> data) async {
    final res = await _client.post('/categories', data: data);
    return CategoryModel.fromJson(res.data['data']);
  }

  Future<CategoryModel> updateCategory(
    String id,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.put('/categories/$id', data: data);
    return CategoryModel.fromJson(res.data['data']);
  }

  Future<void> deleteCategory(String id) async {
    await _client.delete('/categories/$id');
  }

  Future<List<SupplierModel>> getSuppliers({String? search}) async {
    final res = await _client.get(
      '/suppliers',
      queryParameters: {'search': search, 'limit': 1000},
    );
    final data = res.data['data']['data'] as List;
    return data.map((e) => SupplierModel.fromJson(e)).toList();
  }

  Future<SupplierModel> createSupplier(Map<String, dynamic> data) async {
    final res = await _client.post('/suppliers', data: data);
    return SupplierModel.fromJson(res.data['data']);
  }

  Future<SupplierModel> updateSupplier(
    String id,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.put('/suppliers/$id', data: data);
    return SupplierModel.fromJson(res.data['data']);
  }

  Future<void> deleteSupplier(String id) async {
    await _client.delete('/suppliers/$id');
  }

  Future<List<DiscountModel>> getDiscounts() async {
    final res = await _client.get(
      '/discounts',
      queryParameters: {'limit': 1000},
    );
    final data = res.data['data']['data'] as List;
    return data.map((e) => DiscountModel.fromJson(e)).toList();
  }

  Future<DiscountModel> createDiscount(Map<String, dynamic> data) async {
    final res = await _client.post('/discounts', data: data);
    return DiscountModel.fromJson(res.data['data']);
  }

  Future<DiscountModel> updateDiscount(
    String id,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.put('/discounts/$id', data: data);
    return DiscountModel.fromJson(res.data['data']);
  }

  Future<void> deleteDiscount(String id) async {
    await _client.delete('/discounts/$id');
  }

  Future<List<Map<String, dynamic>>> getItemDiscount(String itemId) async {
    try {
      final res = await _client.get('/discounts/item/$itemId');
      final data = res.data['data'];
      if (data is List) {
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getPartyDiscount(String partyId) async {
    try {
      final res = await _client.get('/discounts/party/$partyId');
      final data = res.data['data'];
      if (data is List) {
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (_) {
      return [];
    }
  }
}
