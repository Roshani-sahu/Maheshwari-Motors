import { authService } from "../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../utils/index.js";

const registerSchema = {
  username: {
    required: true,
    type: "string",
    min: 3,
    max: 30,
    label: "Username",
  },
  email: { required: true, type: "string", format: "email", label: "Email" },
  password: {
    required: true,
    type: "string",
    min: 6,
    max: 100,
    label: "Password",
  },
};

const loginSchema = {
  email: { required: true, type: "string", label: "Email" },
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

export const register = asyncHandler(async (req, res) => {
  const data = validate(req.body, registerSchema);
  const result = await authService.register(data);
  res
    .status(201)
    .json(new ApiResponse(201, result, "User registered successfully"));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, device_name, device_type } = validate(
    req.body,
    loginSchema,
  );
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
  const { current_password, new_password } = validate(
    req.body,
    changePasswordSchema,
  );
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
