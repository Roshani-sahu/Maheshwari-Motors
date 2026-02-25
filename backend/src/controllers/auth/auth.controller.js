import { authService } from "../../services/index.js";
import { asyncHandler, ApiResponse } from "../../utils/index.js";

class AuthController {
  registerMainUser = asyncHandler(async (req, res) => {
    const result = await authService.registerMainUser(req.body);
    res
      .status(201)
      .json(new ApiResponse(201, result, "Main user registered successfully"));
  });

  login = asyncHandler(async (req, res) => {
    const { username, password, device_name, device_type } = req.body;
    const ip_address =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const result = await authService.login(username, password, {
      device_name,
      device_type,
      ip_address,
    });
    res.status(200).json(new ApiResponse(200, result, "Login successful"));
  });

  logout = asyncHandler(async (req, res) => {
    await authService.logout(req.token);
    res.status(200).json(new ApiResponse(200, null, "Logout successful"));
  });

  getProfile = asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(
      req.user,
      req.role,
      req.firmType,
    );
    res
      .status(200)
      .json(new ApiResponse(200, profile, "Profile fetched successfully"));
  });

  changePassword = asyncHandler(async (req, res) => {
    const { current_password, new_password } = req.body;
    await authService.changePassword(
      req.user._id,
      req.role,
      req.firmType,
      current_password,
      new_password,
    );
    res
      .status(200)
      .json(new ApiResponse(200, null, "Password changed successfully"));
  });

  getSessions = asyncHandler(async (req, res) => {
    const sessions = await authService.getSessions(
      req.user._id,
      req.role,
      req.firmType,
      req.token,
    );
    res
      .status(200)
      .json(new ApiResponse(200, sessions, "Sessions fetched successfully"));
  });

  revokeSession = asyncHandler(async (req, res) => {
    await authService.revokeSession(req.params.sessionId, req.user._id);
    res
      .status(200)
      .json(new ApiResponse(200, null, "Session revoked successfully"));
  });

  revokeAllOtherSessions = asyncHandler(async (req, res) => {
    await authService.revokeAllOtherSessions(
      req.user._id,
      req.role,
      req.firmType,
      req.token,
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, null, "All other sessions revoked successfully"),
      );
  });
}

export default new AuthController();
