import bcrypt from "bcryptjs";
import User from "../../models/auth/user.model.js";
import Session from "../../models/auth/session.model.js";
import { ApiError, Pagination } from "../../utils/index.js";

class AdminService {
  _validateFirmRequired(firm, label) {
    const required = [
      "username",
      "password",
      "name",
      "phone",
      "email",
      "address",
      "city",
      "state",
    ];
    const missing = required.filter(
      (f) => !firm[f] || (typeof firm[f] === "string" && !firm[f].trim()),
    );
    if (missing.length > 0) {
      throw ApiError.badRequest(
        `${label}: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required`,
      );
    }
    if (firm.password.length < 6) {
      throw ApiError.badRequest(
        `${label}: Password must be at least 6 characters`,
      );
    }
    if (firm.username.trim().length < 3) {
      throw ApiError.badRequest(
        `${label}: Username must be at least 3 characters`,
      );
    }
  }

  async createSecondaryUser(data) {
    const { name, email, phone, gst_firm, nongst_firm } = data;

    // --- Required top-level checks ---
    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("User name is required");
    }
    if (!gst_firm || typeof gst_firm !== "object") {
      throw ApiError.badRequest("GST Firm details are required");
    }
    if (!nongst_firm || typeof nongst_firm !== "object") {
      throw ApiError.badRequest("Non-GST Firm details are required");
    }

    // --- Validate firm sub-fields ---
    this._validateFirmRequired(gst_firm, "GST Firm");
    this._validateFirmRequired(nongst_firm, "Non-GST Firm");

    // --- Check username uniqueness ---
    const existingGst = await User.findOne({
      "gst_firm.username": gst_firm.username.trim(),
    });
    if (existingGst) {
      throw ApiError.conflict("GST Firm username is already taken");
    }
    const existingNongst = await User.findOne({
      "nongst_firm.username": nongst_firm.username.trim(),
    });
    if (existingNongst) {
      throw ApiError.conflict("Non-GST Firm username is already taken");
    }

    // --- Check email uniqueness (if provided) ---
    if (email) {
      const existingEmail = await User.findOne({ email: email.trim() });
      if (existingEmail) {
        throw ApiError.conflict("A user with this email already exists");
      }
    }

    const gstPwHash = await bcrypt.hash(gst_firm.password, 10);
    const nongstPwHash = await bcrypt.hash(nongst_firm.password, 10);

    const {
      username: gstUsername,
      name: gstName,
      phone: gstPhone,
      email: gstEmail,
      address: gstAddress,
      godown_address: gstGodownAddress,
      city: gstCity,
      state: gstState,
      GSTIN: gstGSTIN,
      CIN: gstCIN,
      reg_number: gstRegNumber,
      bank_name: gstBankName,
      bank_branch: gstBankBranch,
      ifsc_code: gstIfscCode,
      account_number: gstAccountNumber,
    } = gst_firm;

    const {
      username: nongstUsername,
      name: nongstName,
      phone: nongstPhone,
      email: nongstEmail,
      address: nongstAddress,
      godown_address: nongstGodownAddress,
      city: nongstCity,
      state: nongstState,
      GSTIN: nongstGSTIN,
      CIN: nongstCIN,
      reg_number: nongstRegNumber,
      bank_name: nongstBankName,
      bank_branch: nongstBankBranch,
      ifsc_code: nongstIfscCode,
      account_number: nongstAccountNumber,
    } = nongst_firm;

    const user = await User.create({
      type: "secondary",
      name,
      email,
      phone,
      admin: null,
      gst_firm: {
        username: gstUsername,
        password: gstPwHash,
        name: gstName,
        phone: gstPhone,
        email: gstEmail,
        address: gstAddress,
        godown_address: gstGodownAddress,
        city: gstCity,
        state: gstState,
        GSTIN: gstGSTIN,
        CIN: gstCIN,
        reg_number: gstRegNumber,
        bank_name: gstBankName,
        bank_branch: gstBankBranch,
        ifsc_code: gstIfscCode,
        account_number: gstAccountNumber,
      },
      nongst_firm: {
        username: nongstUsername,
        password: nongstPwHash,
        name: nongstName,
        phone: nongstPhone,
        email: nongstEmail,
        address: nongstAddress,
        godown_address: nongstGodownAddress,
        city: nongstCity,
        state: nongstState,
        GSTIN: nongstGSTIN,
        CIN: nongstCIN,
        reg_number: nongstRegNumber,
        bank_name: nongstBankName,
        bank_branch: nongstBankBranch,
        ifsc_code: nongstIfscCode,
        account_number: nongstAccountNumber,
      },
    });

    return user.toSafeObject();
  }

  async getSecondaryUsers(query) {
    return Pagination.paginate(
      User,
      { type: "secondary" },
      { ...query, sort: { createdAt: -1 } },
    );
  }

  async getSecondaryUserById(userId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");
    return user.toSafeObject();
  }

  _validateFirmUpdate(firm, label) {
    if (typeof firm !== "object" || firm === null || Array.isArray(firm)) {
      throw ApiError.badRequest(`${label} must be an object`);
    }
    if (firm.password !== undefined) {
      if (typeof firm.password !== "string" || firm.password.length < 6) {
        throw ApiError.badRequest(
          `${label}: Password must be at least 6 characters`,
        );
      }
    }
    if (firm.username !== undefined) {
      if (
        typeof firm.username !== "string" ||
        firm.username.trim().length < 3
      ) {
        throw ApiError.badRequest(
          `${label}: Username must be at least 3 characters`,
        );
      }
    }
  }

  async _checkFirmUsernameUniqueness(firmPath, username, excludeUserId) {
    const existing = await User.findOne({
      [`${firmPath}.username`]: username.trim(),
      _id: { $ne: excludeUserId },
    });
    if (existing) {
      const label = firmPath === "gst_firm" ? "GST Firm" : "Non-GST Firm";
      throw ApiError.conflict(`${label} username is already taken`);
    }
  }

  async updateSecondaryUser(userId, updateData) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    const { name, email, phone, is_active, gst_firm, nongst_firm } = updateData;

    // --- Guard: at least one field to update ---
    if (
      !name &&
      !email &&
      !phone &&
      is_active === undefined &&
      !gst_firm &&
      !nongst_firm
    ) {
      throw ApiError.badRequest("No fields provided to update");
    }

    // --- Validate & apply top-level fields ---
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        throw ApiError.badRequest("Name must be a non-empty string");
      }
      user.name = name.trim();
    }
    if (email !== undefined) {
      if (email) {
        const existingEmail = await User.findOne({
          email: email.trim(),
          _id: { $ne: userId },
        });
        if (existingEmail) {
          throw ApiError.conflict("A user with this email already exists");
        }
      }
      user.email = email;
    }
    if (phone !== undefined) user.phone = phone;
    if (is_active !== undefined) user.is_active = is_active;

    // --- Validate & apply GST firm updates ---
    if (gst_firm) {
      this._validateFirmUpdate(gst_firm, "GST Firm");

      const {
        username,
        password,
        name: firmName,
        phone: firmPhone,
        email: firmEmail,
        address,
        godown_address,
        city,
        state,
        GSTIN,
        CIN,
        reg_number,
        bank_name,
        bank_branch,
        ifsc_code,
        account_number,
      } = gst_firm;

      if (username !== undefined) {
        await this._checkFirmUsernameUniqueness("gst_firm", username, userId);
        user.gst_firm.username = username.trim();
      }
      if (password) user.gst_firm.password = await bcrypt.hash(password, 10);
      if (firmName !== undefined) user.gst_firm.name = firmName;
      if (firmPhone !== undefined) user.gst_firm.phone = firmPhone;
      if (firmEmail !== undefined) user.gst_firm.email = firmEmail;
      if (address !== undefined) user.gst_firm.address = address;
      if (godown_address !== undefined)
        user.gst_firm.godown_address = godown_address;
      if (city !== undefined) user.gst_firm.city = city;
      if (state !== undefined) user.gst_firm.state = state;
      if (GSTIN !== undefined) user.gst_firm.GSTIN = GSTIN;
      if (CIN !== undefined) user.gst_firm.CIN = CIN;
      if (reg_number !== undefined) user.gst_firm.reg_number = reg_number;
      if (bank_name !== undefined) user.gst_firm.bank_name = bank_name;
      if (bank_branch !== undefined) user.gst_firm.bank_branch = bank_branch;
      if (ifsc_code !== undefined) user.gst_firm.ifsc_code = ifsc_code;
      if (account_number !== undefined)
        user.gst_firm.account_number = account_number;
    }

    // --- Validate & apply Non-GST firm updates ---
    if (nongst_firm) {
      this._validateFirmUpdate(nongst_firm, "Non-GST Firm");

      const {
        username,
        password,
        name: firmName,
        phone: firmPhone,
        email: firmEmail,
        address,
        godown_address,
        city,
        state,
        GSTIN,
        CIN,
        reg_number,
        bank_name,
        bank_branch,
        ifsc_code,
        account_number,
      } = nongst_firm;

      if (username !== undefined) {
        await this._checkFirmUsernameUniqueness(
          "nongst_firm",
          username,
          userId,
        );
        user.nongst_firm.username = username.trim();
      }
      if (password) user.nongst_firm.password = await bcrypt.hash(password, 10);
      if (firmName !== undefined) user.nongst_firm.name = firmName;
      if (firmPhone !== undefined) user.nongst_firm.phone = firmPhone;
      if (firmEmail !== undefined) user.nongst_firm.email = firmEmail;
      if (address !== undefined) user.nongst_firm.address = address;
      if (godown_address !== undefined)
        user.nongst_firm.godown_address = godown_address;
      if (city !== undefined) user.nongst_firm.city = city;
      if (state !== undefined) user.nongst_firm.state = state;
      if (GSTIN !== undefined) user.nongst_firm.GSTIN = GSTIN;
      if (CIN !== undefined) user.nongst_firm.CIN = CIN;
      if (reg_number !== undefined) user.nongst_firm.reg_number = reg_number;
      if (bank_name !== undefined) user.nongst_firm.bank_name = bank_name;
      if (bank_branch !== undefined) user.nongst_firm.bank_branch = bank_branch;
      if (ifsc_code !== undefined) user.nongst_firm.ifsc_code = ifsc_code;
      if (account_number !== undefined)
        user.nongst_firm.account_number = account_number;
    }

    await user.save();
    return user.toSafeObject();
  }

  async deactivateSecondaryUser(userId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    user.is_active = false;
    await user.save();

    await Session.deleteMany({ user_id: userId });
    return user.toSafeObject();
  }

  async reactivateSecondaryUser(userId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    user.is_active = true;
    await user.save();
    return user.toSafeObject();
  }

  async deleteSecondaryUser(userId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    await Session.deleteMany({ user_id: userId });
    await User.findByIdAndDelete(userId);
  }
}

export default new AdminService();
