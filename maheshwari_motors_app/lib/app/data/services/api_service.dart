import 'package:get/get.dart' hide FormData, MultipartFile;
import 'package:dio/dio.dart' as dio;

import '../../core/network/api_client.dart';
import '../models/user_model.dart';
import '../models/firm_model.dart';
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

  // ─── AUTH ─────────────────────────────────────────
  Future<Map<String, dynamic>> login(
    String identifier,
    String password, {
    String? deviceName,
    String? deviceType,
  }) async {
    final res = await _client.post(
      '/auth/login',
      data: {
        'email': identifier,
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

  // ─── SESSIONS (Multi-Device) ─────────────────────
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

  // ─── FIRMS ────────────────────────────────────────
  Future<List<FirmModel>> getFirms() async {
    final res = await _client.get('/firms');
    final data = res.data['data']['data'] as List;
    return data.map((e) => FirmModel.fromJson(e)).toList();
  }

  Future<FirmModel> getFirmById(String id) async {
    final res = await _client.get('/firms/$id');
    return FirmModel.fromJson(res.data['data']);
  }

  Future<FirmModel> createFirm(Map<String, dynamic> data) async {
    final res = await _client.post('/firms', data: data);
    return FirmModel.fromJson(res.data['data']);
  }

  Future<FirmModel> updateFirm(String id, Map<String, dynamic> data) async {
    final res = await _client.put('/firms/$id', data: data);
    return FirmModel.fromJson(res.data['data']);
  }

  Future<void> deleteFirm(String id) async {
    await _client.delete('/firms/$id');
  }

  // ─── ITEMS ────────────────────────────────────────
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

  // ─── PARTIES ──────────────────────────────────────
  Future<List<PartyModel>> getParties(String firmId) async {
    final res = await _client.get('/firms/$firmId/parties');
    final data = res.data['data']['data'] as List;
    return data.map((e) => PartyModel.fromJson(e)).toList();
  }

  Future<PartyModel> createParty(
    String firmId,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.post('/firms/$firmId/parties', data: data);
    return PartyModel.fromJson(res.data['data']);
  }

  Future<PartyModel> updateParty(
    String firmId,
    String partyId,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.put(
      '/firms/$firmId/parties/$partyId',
      data: data,
    );
    return PartyModel.fromJson(res.data['data']);
  }

  Future<void> deleteParty(String firmId, String partyId) async {
    await _client.delete('/firms/$firmId/parties/$partyId');
  }

  // ─── CHALLANS ─────────────────────────────────────
  Future<List<ChallanModel>> getChallans(String firmId) async {
    final res = await _client.get('/firms/$firmId/challans');
    final data = res.data['data']['data'] as List;
    return data.map((e) => ChallanModel.fromJson(e)).toList();
  }

  Future<ChallanModel> getChallanById(String firmId, String id) async {
    final res = await _client.get('/firms/$firmId/challans/$id');
    return ChallanModel.fromJson(res.data['data']);
  }

  Future<void> deleteChallan(String firmId, String id) async {
    await _client.delete('/firms/$firmId/challans/$id');
  }

  Future<ChallanModel> createChallan(
    String firmId,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.post('/firms/$firmId/challans', data: data);
    return ChallanModel.fromJson(res.data['data']);
  }

  Future<ChallanModel> updateChallan(
    String firmId,
    String id,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.put('/firms/$firmId/challans/$id', data: data);
    return ChallanModel.fromJson(res.data['data']);
  }

  // ─── BILLS ────────────────────────────────────────
  Future<List<BillModel>> getBills(String firmId) async {
    final res = await _client.get('/firms/$firmId/bills');
    final data = res.data['data']['data'] as List;
    return data.map((e) => BillModel.fromJson(e)).toList();
  }

  Future<BillModel> getBillById(String firmId, String id) async {
    final res = await _client.get('/firms/$firmId/bills/$id');
    return BillModel.fromJson(res.data['data']);
  }

  Future<void> deleteBill(String firmId, String id) async {
    await _client.delete('/firms/$firmId/bills/$id');
  }

  Future<BillModel> createBill(String firmId, Map<String, dynamic> data) async {
    final res = await _client.post('/firms/$firmId/bills', data: data);
    return BillModel.fromJson(res.data['data']);
  }

  Future<BillModel> updateBill(
    String firmId,
    String id,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.put('/firms/$firmId/bills/$id', data: data);
    return BillModel.fromJson(res.data['data']);
  }

  Future<void> recordPayment(
    String firmId,
    String billId,
    Map<String, dynamic> data,
  ) async {
    await _client.post('/firms/$firmId/bills/$billId/payment', data: data);
  }

  // ─── TRANSACTIONS ─────────────────────────────────
  Future<List<TransactionModel>> getTransactions(String firmId) async {
    final res = await _client.get('/firms/$firmId/transactions');
    final data = res.data['data']['data'] as List;
    return data.map((e) => TransactionModel.fromJson(e)).toList();
  }

  Future<Map<String, dynamic>> getTransactionSummary(String firmId) async {
    final res = await _client.get('/firms/$firmId/transactions/summary');
    return res.data['data'];
  }

  Future<TransactionModel> createSaleTransaction(
    String firmId,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.post(
      '/firms/$firmId/transactions/sale',
      data: data,
    );
    return TransactionModel.fromJson(res.data['data']);
  }

  Future<TransactionModel> createPurchaseTransaction(
    String firmId,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.post(
      '/firms/$firmId/transactions/purchase',
      data: data,
    );
    return TransactionModel.fromJson(res.data['data']);
  }

  // ─── STOCK ALERTS ─────────────────────────────────
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

  // ─── USERS (SECONDARY) ───────────────────────────
  Future<List<UserModel>> getUsers() async {
    final res = await _client.get('/users');
    final data = res.data['data']['data'] as List;
    return data.map((e) => UserModel.fromJson(e)).toList();
  }

  Future<UserModel> createUser(Map<String, dynamic> data) async {
    final res = await _client.post('/users', data: data);
    return UserModel.fromJson(res.data['data']);
  }

  Future<UserModel> updateUser(String id, Map<String, dynamic> data) async {
    final res = await _client.put('/users/$id', data: data);
    return UserModel.fromJson(res.data['data']);
  }

  Future<void> deleteUser(String id) async {
    await _client.delete('/users/$id');
  }

  // ─── DASHBOARD ────────────────────────────────────
  Future<Map<String, dynamic>> getFirmDashboard(
    String firmId, {
    String period = 'all_time',
  }) async {
    final res = await _client.get(
      '/firms/$firmId/dashboard',
      queryParameters: {'period': period},
    );
    return res.data['data'] ?? {};
  }

  // ─── CATEGORY ─────────────────────────────────────
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

  // ─── SUPPLIER ─────────────────────────────────────
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

  // ─── DISCOUNTS ────────────────────────────────────
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

  Future<Map<String, dynamic>?> getItemDiscount(String itemId) async {
    try {
      final res = await _client.get('/discounts/item/$itemId');
      return res.data['data'] as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> getPartyDiscount(String partyId) async {
    try {
      final res = await _client.get('/discounts/party/$partyId');
      return res.data['data'] as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  // ─── UNCONVERTED CHALLANS ─────────────────────────
  Future<List<ChallanModel>> getUnconvertedChallans(
    String firmId,
    String partyId,
  ) async {
    final res = await _client.get('/firms/$firmId/parties/$partyId/challans');
    final data = res.data['data'] as List;
    return data.map((e) => ChallanModel.fromJson(e)).toList();
  }

  // ─── PURCHASES ────────────────────────────────────
  Future<List<PurchaseModel>> getPurchases(String firmId) async {
    final res = await _client.get('/firms/$firmId/purchases');
    final data = res.data['data']['data'] as List;
    return data.map((e) => PurchaseModel.fromJson(e)).toList();
  }

  Future<PurchaseModel> createPurchase(
    String firmId,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.post('/firms/$firmId/purchases', data: data);
    return PurchaseModel.fromJson(res.data['data']);
  }

  Future<void> deletePurchase(String firmId, String id) async {
    await _client.delete('/firms/$firmId/purchases/$id');
  }

  // ─── BILL RETURN ──────────────────────────────────
  Future<void> recordBillReturn(
    String firmId,
    String billId,
    Map<String, dynamic> data,
  ) async {
    await _client.post('/firms/$firmId/bills/$billId/return', data: data);
  }
}
