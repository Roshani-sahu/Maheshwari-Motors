import { authService } from "../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../utils/index.js";

/**
 * Auth Controller (Redesigned)
 *
 * NEW ENDPOINTS:
 * - POST /auth/admin/register - Register new admin (protected, admin-only)
 * - POST /auth/admin/login - Admin login
 * - POST /auth/firm/login - Firm login (daily operations)
 *
 * DEPRECATED (kept for backward compat):
 * - POST /auth/register - User registration
 * - POST /auth/login - User login
 */

// ============ VALIDATION SCHEMAS ============

const adminRegisterSchema = {
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
  name: { required: true, type: "string", min: 2, max: 100, label: "Name" },
};

const adminLoginSchema = {
  username: { required: true, type: "string", label: "Username or Email" },
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

const firmLoginSchema = {
  username: { required: true, type: "string", label: "Firm Username" },
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

// DEPRECATED schemas
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

// ============ ADMIN AUTH ============

export const registerAdmin = asyncHandler(async (req, res) => {
  const data = validate(req.body, adminRegisterSchema);
  const result = await authService.registerAdmin(data);
  res
    .status(201)
    .json(new ApiResponse(201, result, "Admin registered successfully"));
});

export const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password, device_name, device_type } = validate(
    req.body,
    adminLoginSchema,
  );
  const ip_address =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  const result = await authService.loginAdmin(username, password, {
    device_name,
    device_type,
    ip_address,
  });
  res.status(200).json(new ApiResponse(200, result, "Admin login successful"));
});

// ============ FIRM AUTH ============

export const loginFirm = asyncHandler(async (req, res) => {
  const { username, password, device_name, device_type } = validate(
    req.body,
    firmLoginSchema,
  );
  const ip_address =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  const result = await authService.loginFirm(username, password, {
    device_name,
    device_type,
    ip_address,
  });
  res.status(200).json(new ApiResponse(200, result, "Firm login successful"));
});

// ============ GENERIC AUTH ============

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.token);
  res.status(200).json(new ApiResponse(200, null, "Logout successful"));
});

export const getProfile = asyncHandler(async (req, res) => {
  let profile;
  if (req.role === "admin") {
    profile = req.admin;
  } else if (req.role === "firm") {
    profile = await authService.getFirmProfile(req.firm._id);
  } else {
    profile = await authService.getProfile(req.user._id);
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...profile, role: req.role },
        "Profile fetched successfully",
      ),
    );
});

export const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = validate(
    req.body,
    changePasswordSchema,
  );

  let entityId;
  if (req.role === "admin") {
    entityId = req.admin._id;
  } else if (req.role === "firm") {
    entityId = req.firm._id;
  } else {
    entityId = req.user._id;
  }

  await authService.changePassword(
    req.role,
    entityId,
    current_password,
    new_password,
  );
  res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

export const getSessions = asyncHandler(async (req, res) => {
  let entityId;
  if (req.role === "admin") {
    entityId = req.admin._id;
  } else if (req.role === "firm") {
    entityId = req.firm._id;
  } else {
    entityId = req.user._id;
  }

  const sessions = await authService.getSessions(req.role, entityId, req.token);
  res
    .status(200)
    .json(new ApiResponse(200, sessions, "Sessions fetched successfully"));
});

export const revokeSession = asyncHandler(async (req, res) => {
  let entityId;
  if (req.role === "admin") {
    entityId = req.admin._id;
  } else if (req.role === "firm") {
    entityId = req.firm._id;
  } else {
    entityId = req.user._id;
  }

  await authService.revokeSession(req.params.sessionId, req.role, entityId);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Session revoked successfully"));
});

export const revokeAllOtherSessions = asyncHandler(async (req, res) => {
  let entityId;
  if (req.role === "admin") {
    entityId = req.admin._id;
  } else if (req.role === "firm") {
    entityId = req.firm._id;
  } else {
    entityId = req.user._id;
  }

  await authService.revokeAllOtherSessions(req.role, entityId, req.token);
  res
    .status(200)
    .json(
      new ApiResponse(200, null, "All other sessions revoked successfully"),
    );
});

// ============ DEPRECATED: USER AUTH ============

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
