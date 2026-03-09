import mongoose from "mongoose";
import Bank from "../../models/master/bank.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

class BankService {
  async getBanks(userId, query = {}) {
    const filter = { user_id: userId };

    if (query.bank_type) {
      filter.bank_type = query.bank_type;
    }

    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { bank_name: { $regex: escaped, $options: "i" } },
        { account_number: { $regex: escaped, $options: "i" } },
        { ifsc_code: { $regex: escaped, $options: "i" } },
      ];
    }

    return Pagination.paginate(Bank, filter, {
      ...query,
      sort: { is_default: -1, createdAt: -1 },
    });
  }

  async getBankById(bankId, userId) {
    const bank = await Bank.findOne({ _id: bankId, user_id: userId }).lean();
    if (!bank) throw ApiError.notFound("Bank not found");
    return bank;
  }

  async createBank(bankData, userId) {
    const { bank_name, bank_branch, ifsc_code, account_number, account_holder, upi_id, bank_type, is_default } = bankData;

    if (!bank_name || typeof bank_name !== "string" || !bank_name.trim()) {
      throw ApiError.badRequest("Bank name is required");
    }
    if (!account_number || typeof account_number !== "string" || !account_number.trim()) {
      throw ApiError.badRequest("Account number is required");
    }

    const duplicate = await Bank.findOne({
      account_number: account_number.trim(),
      user_id: userId,
    }).lean();
    if (duplicate) {
      throw ApiError.conflict("A bank with this account number already exists");
    }

    if (is_default) {
      await Bank.updateMany({ user_id: userId, is_default: true }, { is_default: false });
    }

    const bankCount = await Bank.countDocuments({ user_id: userId });
    const shouldDefault = is_default || bankCount === 0;

    const bank = await Bank.create({
      id: await getNextId("Bank", userId),
      bank_name: bank_name.trim(),
      bank_branch: bank_branch?.trim() || "",
      ifsc_code: ifsc_code?.trim() || "",
      account_number: account_number.trim(),
      account_holder: account_holder?.trim() || "",
      upi_id: upi_id?.trim() || "",
      bank_type: bank_type || "firm",
      is_default: shouldDefault,
      user_id: userId,
    });

    return bank;
  }

  async updateBank(bankId, userId, updateData) {
    const bank = await Bank.findOne({ _id: bankId, user_id: userId });
    if (!bank) throw ApiError.notFound("Bank not found");

    const { bank_name, bank_branch, ifsc_code, account_number, account_holder, upi_id, bank_type, is_default } = updateData;

    if (account_number !== undefined) {
      if (typeof account_number !== "string" || !account_number.trim()) {
        throw ApiError.badRequest("Account number cannot be empty");
      }
      const duplicate = await Bank.findOne({
        account_number: account_number.trim(),
        user_id: userId,
        _id: { $ne: bankId },
      }).lean();
      if (duplicate) {
        throw ApiError.conflict("Another bank with this account number already exists");
      }
    }

    if (is_default === true) {
      await Bank.updateMany({ user_id: userId, is_default: true, _id: { $ne: bankId } }, { is_default: false });
    }

    const fields = {};
    if (bank_name !== undefined) fields.bank_name = bank_name.trim();
    if (bank_branch !== undefined) fields.bank_branch = bank_branch.trim();
    if (ifsc_code !== undefined) fields.ifsc_code = ifsc_code.trim();
    if (account_number !== undefined) fields.account_number = account_number.trim();
    if (account_holder !== undefined) fields.account_holder = account_holder.trim();
    if (upi_id !== undefined) fields.upi_id = upi_id.trim();
    if (bank_type !== undefined) fields.bank_type = bank_type;
    if (is_default !== undefined) fields.is_default = is_default;

    return Bank.findByIdAndUpdate(bankId, fields, { new: true }).lean();
  }

  async deleteBank(bankId, userId) {
    const bank = await Bank.findOne({ _id: bankId, user_id: userId });
    if (!bank) throw ApiError.notFound("Bank not found");

    const wasDefault = bank.is_default;
    await Bank.findByIdAndDelete(bankId);

    if (wasDefault) {
      const nextBank = await Bank.findOne({ user_id: userId }).sort({ createdAt: 1 });
      if (nextBank) {
        nextBank.is_default = true;
        await nextBank.save();
      }
    }
  }

  async getDefaultBank(userId) {
    const bank = await Bank.findOne({ user_id: userId, is_default: true }).lean();
    return bank || null;
  }

  async getBankSnapshot(bankId, userId) {
    if (!bankId) return null;
    if (!mongoose.Types.ObjectId.isValid(bankId)) {
      throw ApiError.badRequest("Invalid bank ID");
    }
    const bank = await Bank.findOne({ _id: bankId, user_id: userId }).lean();
    if (!bank) throw ApiError.badRequest("Bank not found");
    return {
      bank_id: bank._id,
      bank_name: bank.bank_name,
      bank_branch: bank.bank_branch || "",
      ifsc_code: bank.ifsc_code || "",
      account_number: bank.account_number || "",
      account_holder: bank.account_holder || "",
      bank_type: bank.bank_type || "firm",
    };
  }
}

export default new BankService();
