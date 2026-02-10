import { authService } from "../services/index.js";
import { asyncHandler, ApiResponse } from "../utils/index.js";

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const result = await authService.register({ username, email, password });
  res
    .status(201)
    .json(new ApiResponse(201, result, "User registered successfully"));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, device_name, device_type } = req.body;
  const ip_address =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  const result = await authService.login(email, password, {
    device_name,
    device_type,
    ip_address,
  });
  res.status(200).json(new ApiResponse(200, result, "Login successful"));
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id, req.token);
  res.status(200).json(new ApiResponse(200, null, "Logout successful"));
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, user, "Profile fetched successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  await authService.changePassword(
    req.user._id,
    current_password,
    new_password,
  );
  res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getSessions(req.user._id, req.token);
  res
    .status(200)
    .json(new ApiResponse(200, sessions, "Sessions fetched successfully"));
});

export const revokeSession = asyncHandler(async (req, res) => {
  await authService.revokeSession(req.params.sessionId, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Session revoked successfully"));
});

export const revokeAllOtherSessions = asyncHandler(async (req, res) => {
  await authService.revokeAllOtherSessions(req.user._id, req.token);
  res
    .status(200)
    .json(
      new ApiResponse(200, null, "All other sessions revoked successfully"),
    );
});
