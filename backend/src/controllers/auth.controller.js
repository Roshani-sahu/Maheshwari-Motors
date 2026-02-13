import { authService } from "../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../utils/index.js";

const registerSchema = {
  name: { required: true, type: "string", min: 2, max: 100, label: "Name" },
  email: { required: false, type: "string", format: "email", label: "Email" },
  phone: { required: false, type: "string", label: "Phone" },
  admin: { required: true, type: "object", label: "Admin credentials" },
  gst_firm: { required: true, type: "object", label: "GST Firm" },
  nongst_firm: { required: true, type: "object", label: "Non-GST Firm" },
};

const loginSchema = {
  username: { required: true, type: "string", label: "Username" },
  password: { required: true, type: "string", label: "Password" },
  device_name: {
    required: false,
    type: "string",
    max: 100,
    label: "Device name",
  },
  device_type: {
    required: false,
    type: "string",
    enum: ["android", "ios", "web", "desktop", "unknown"],
    label: "Device type",
  },
};

const changePasswordSchema = {
  current_password: {
    required: true,
    type: "string",
    label: "Current password",
  },
  new_password: {
    required: true,
    type: "string",
    min: 6,
    max: 100,
    label: "New password",
  },
};

export const registerMainUser = asyncHandler(async (req, res) => {
  const data = validate(req.body, registerSchema);
  const result = await authService.registerMainUser(data);
  res
    .status(201)
    .json(new ApiResponse(201, result, "Main user registered successfully"));
});

export const login = asyncHandler(async (req, res) => {
  const { username, password, device_name, device_type } = validate(
    req.body,
    loginSchema,
  );
  const ip_address =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  const result = await authService.login(username, password, {
    device_name,
    device_type,
    ip_address,
  });
  res.status(200).json(new ApiResponse(200, result, "Login successful"));
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.token);
  res.status(200).json(new ApiResponse(200, null, "Logout successful"));
});

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(
    req.user,
    req.role,
    req.firmType,
  );
  res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile fetched successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = validate(
    req.body,
    changePasswordSchema,
  );
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

export const getSessions = asyncHandler(async (req, res) => {
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

export const revokeSession = asyncHandler(async (req, res) => {
  await authService.revokeSession(req.params.sessionId, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Session revoked successfully"));
});

export const revokeAllOtherSessions = asyncHandler(async (req, res) => {
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
