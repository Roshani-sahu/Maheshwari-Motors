import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get/get.dart' hide Response, FormData, MultipartFile;

import '../constants/app_constants.dart';
import '../../routes/app_routes.dart';

class ApiClient {
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      resetOnError: true,
    ),
  );

  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: AppConstants.apiTimeout,
        receiveTimeout: AppConstants.apiTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          try {
            final token = await _storage
                .read(key: AppConstants.tokenKey)
                .timeout(const Duration(seconds: 3), onTimeout: () => null);
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          } catch (_) {
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await _storage.delete(key: AppConstants.tokenKey);
            Get.offAllNamed(AppRoutes.login);
            return handler.reject(error);
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<void> setToken(String token) async {
    await _storage.write(key: AppConstants.tokenKey, value: token);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: AppConstants.tokenKey);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: AppConstants.tokenKey);
  }

  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return await _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    return await _dio.post(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    return await _dio.put(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    return await _dio.patch(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    return await _dio.delete(
      path,
      data: data,
      queryParameters: queryParameters,
    );
  }

  Future<Response> postMultipart(
    String path, {
    required FormData formData,
  }) async {
    return await _dio.post(
      path,
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );
  }

  Future<Response> putMultipart(
    String path, {
    required FormData formData,
  }) async {
    return await _dio.put(
      path,
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );
  }

  static String parseError(dynamic error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        final msg = data['message'] ?? data['error'];
        final errors = data['errors'];
        if (errors is List && errors.isNotEmpty) {
          return errors.join(', ');
        }
        if (msg != null && msg.toString().isNotEmpty) {
          return msg.toString();
        }
      }
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Connection timed out. Please try again.';
        case DioExceptionType.connectionError:
          return 'Could not connect to server. Check your internet.';
        case DioExceptionType.badResponse:
          final code = error.response?.statusCode;
          if (code == 404) return 'Resource not found.';
          if (code == 403) return 'You don\'t have permission.';
          if (code == 500) return 'Server error. Please try later.';
          return 'Request failed (status $code).';
        case DioExceptionType.cancel:
          return 'Request was cancelled.';
        default:
          return 'Network error occurred.';
      }
    }
    return error?.toString() ?? 'An unexpected error occurred.';
  }
}
