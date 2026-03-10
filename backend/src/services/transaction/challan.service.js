import mongoose from "mongoose";
import Challan from "../../models/transaction/challan.model.js";
import Item from "../../models/master/item.model.js";
import Contact from "../../models/master/contact.model.js";
import Label from "../../models/master/label.model.js";
import bankService from "../master/bank.service.js";
import { ApiError, Pagination, toNumber } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";
import stockService from "../inventory/stock.service.js";

class ChallanService {
  _round(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  _challanPopulate() {
    return [
      { path: "contact_id", select: "name alias phone type" },
      { path: "label_id", select: "name is_active" },
      { path: "items.item_id", select: "item_name alias description hsn_id" },
    ];
  }

  _attachLegacyLabelName(challan) {
    if (!challan) return challan;

    const normalized =
      typeof challan.toObject === "function" ?
        challan.toObject()
      : { ...challan };

    const populatedLabel =
      normalized.label_id && typeof normalized.label_id === "object" ?
        normalized.label_id
      : null;

    const legacyLabelName =
      populatedLabel?.name ||
      populatedLabel?.label_name ||
      (typeof normalized.label_name === "string" ?
        normalized.label_name.trim() || null
      : null);

    normalized.label_name = legacyLabelName;
    return normalized;
  }

  _attachLegacyLabelNames(challans = []) {
    return challans.map((challan) => this._attachLegacyLabelName(challan));
  }

  async _normalizeBankPayload(bankIdOrObj, userId) {
    if (!bankIdOrObj) return null;

    const bankId =
      typeof bankIdOrObj === "object" ? bankIdOrObj.bank_id : bankIdOrObj;
    if (!bankId) return null;

    return bankService.getBankSnapshot(bankId, userId);
  }

  async _resolveLabelId({
    labelId,
    labelName,
    userId,
    contact = null,
    requiredForSale = false,
  }) {
    let candidateLabelId = labelId;

    if (
      (candidateLabelId === undefined ||
        candidateLabelId === null ||
        candidateLabelId === "") &&
      typeof labelName === "string" &&
      labelName.trim()
    ) {
      const escaped = labelName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const filter = {
        user_id: userId,
        name: { $regex: new RegExp(`^${escaped}$`, "i") },
      };

      const resolvedByName = await Label.findOne(filter).select("_id").lean();
      candidateLabelId = resolvedByName?._id || null;
    }

    if (
      (candidateLabelId === undefined ||
        candidateLabelId === null ||
        candidateLabelId === "") &&
      contact?.label_ids?.length > 0
    ) {
      candidateLabelId = contact.label_ids[0];
    }

    if (
      candidateLabelId === undefined ||
      candidateLabelId === null ||
      candidateLabelId === ""
    ) {
      if (requiredForSale) {
        throw ApiError.badRequest("label_id is required for sale challan");
      }
      return null;
    }

    if (!mongoose.Types.ObjectId.isValid(candidateLabelId)) {
      throw ApiError.badRequest("Invalid label_id");
    }

    const label = await Label.findOne({
      _id: candidateLabelId,
      user_id: userId,
    })
      .select("_id")
      .lean();
    if (!label) {
      throw ApiError.badRequest(
        "Label not found for this account. Please select a valid label_id.",
      );
    }

    return label._id;
  }

  _processItems(items, challanIsGst) {
    return items.map((item, index) => {
      if (!item?.item_id) {
        throw ApiError.badRequest(`items[${index}].item_id is required`);
      }

      const quantityInput = item.quantity ?? item.pcs ?? 1;
      const rateInput = item.rate;
      const discountInput = item.discount ?? item.disPercent ?? 0;
      const specialDiscountInput = item.special_discount ?? item.spDis ?? 0;
      const gstPercentInput = item.gst_percent ?? item.gstPercent ?? 0;
      const grossAmountInput = item.gross_amount ?? item.grossAmount;
      const discountAmountInput = item.discount_amount ?? item.discountAmount;
      const totalDiscountInput = item.total_discount ?? item.totalDiscount;
      const taxableAmountInput = item.taxable_amount ?? item.taxableAmount;
      const gstAmountInput = item.gst_amount ?? item.gstAmount;
      const amountInput = item.amount ?? item.finalAmount;
      const lineTypeInput = item.is_gst ?? item.isGst ?? challanIsGst;

      if (rateInput === undefined) {
        throw ApiError.badRequest(`items[${index}].rate is required`);
      }
      if (grossAmountInput === undefined) {
        throw ApiError.badRequest(`items[${index}].gross_amount is required`);
      }
      if (discountAmountInput === undefined) {
        throw ApiError.badRequest(
          `items[${index}].discount_amount is required`,
        );
      }
      if (totalDiscountInput === undefined) {
        throw ApiError.badRequest(`items[${index}].total_discount is required`);
      }
      if (taxableAmountInput === undefined) {
        throw ApiError.badRequest(`items[${index}].taxable_amount is required`);
      }
      if (gstAmountInput === undefined) {
        throw ApiError.badRequest(`items[${index}].gst_amount is required`);
      }
      if (amountInput === undefined) {
        throw ApiError.badRequest(`items[${index}].amount is required`);
      }

      const normalizedType = Number(lineTypeInput);
      if (![0, 1].includes(normalizedType)) {
        throw ApiError.badRequest(`items[${index}].is_gst must be 0 or 1`);
      }

      return {
        item_id: item.item_id,
        quantity: toNumber(quantityInput, `items[${index}].quantity`, {
          min: 1,
        }),
        rate: toNumber(rateInput, `items[${index}].rate`),
        discount: toNumber(discountInput, `items[${index}].discount`, {
          min: 0,
          max: 100,
        }),
        special_discount: toNumber(
          specialDiscountInput,
          `items[${index}].special_discount`,
          { min: 0, max: 100 },
        ),
        gross_amount: toNumber(
          grossAmountInput,
          `items[${index}].gross_amount`,
        ),
        discount_amount: toNumber(
          discountAmountInput,
          `items[${index}].discount_amount`,
        ),
        total_discount: toNumber(
          totalDiscountInput,
          `items[${index}].total_discount`,
        ),
        taxable_amount: toNumber(
          taxableAmountInput,
          `items[${index}].taxable_amount`,
        ),
        gst_percent: toNumber(gstPercentInput, `items[${index}].gst_percent`, {
          min: 0,
          max: 100,
        }),
        gst_amount: toNumber(gstAmountInput, `items[${index}].gst_amount`),
        amount: toNumber(amountInput, `items[${index}].amount`),
        is_gst: normalizedType,
      };
    });
  }

  _aggregateTotals(processedItems = []) {
    const gross_total = this._round(
      processedItems.reduce(
        (sum, item) => sum + Number(item.gross_amount || 0),
        0,
      ),
    );
    const sub_total = this._round(
      processedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    );

    return {
      gross_total,
      sub_total,
      amount: sub_total,
      discount: 0,
    };
  }

  _normalizeChallanTotals(payload = {}, processedItems = []) {
    const fallback = this._aggregateTotals(processedItems);

    const grossTotalInput = payload.gross_total ?? payload.grossTotal;
    const subTotalInput = payload.sub_total ?? payload.subTotal;
    const discountInput = payload.discount;
    const amountInput = payload.amount;

    const gross_total =
      grossTotalInput !== undefined ?
        toNumber(grossTotalInput, "gross_total")
      : fallback.gross_total;

    const sub_total =
      subTotalInput !== undefined ?
        toNumber(subTotalInput, "sub_total")
      : fallback.sub_total;

    const discount =
      discountInput !== undefined ?
        toNumber(discountInput, "discount")
      : fallback.discount;

    const amount =
      amountInput !== undefined ?
        toNumber(amountInput, "amount")
      : fallback.amount;

    return {
      gross_total: this._round(gross_total),
      sub_total: this._round(sub_total),
      discount: this._round(discount),
      amount: this._round(amount),
    };
  }

  async getChallans(userId, isGst, challanType, query) {
    const filter = { user_id: userId };

    if (challanType) filter.challan_type = challanType;
    if (isGst !== undefined) filter.is_gst = isGst;
    if (challanType === "sale") filter.converted_to_bill = false;
    if (query.contact_id) filter.contact_id = query.contact_id;
    if (query.payment_status) filter.payment_status = query.payment_status;

    if (query.from_date || query.to_date) {
      filter.date = {};
      if (query.from_date) filter.date.$gte = new Date(query.from_date);
      if (query.to_date) filter.date.$lte = new Date(query.to_date);
    }

    const result = await Pagination.paginate(Challan, filter, {
      ...query,
      populate: this._challanPopulate(),
      sort: { createdAt: -1 },
    });

    result.data = this._attachLegacyLabelNames(result.data);
    return result;
  }

  async getChallanById(challanId, userId, isGst) {
    const filter = {
      _id: challanId,
      user_id: userId,
    };
    if (isGst !== undefined) filter.is_gst = isGst;

    const challan = await Challan.findOne(filter).populate(
      this._challanPopulate(),
    );

    if (!challan) throw ApiError.notFound("Challan not found");
    return this._attachLegacyLabelName(challan);
  }

  async _resolveChallanNo(
    providedChallanNo,
    counterKey,
    prefix,
    userId,
    isGst,
    challanType,
  ) {
    if (
      providedChallanNo &&
      typeof providedChallanNo === "string" &&
      providedChallanNo.trim()
    ) {
      const trimmed = providedChallanNo.trim();
      const exists = await Challan.exists({
        challan_no: trimmed,
        user_id: userId,
        is_gst: isGst,
        challan_type: challanType,
      });
      if (exists) {
        throw ApiError.conflict(
          `Challan number '${trimmed}' already exists. Please use a different challan number.`,
        );
      }
      return trimmed;
    }
    const seq = await getNextId(counterKey, userId);
    return `${prefix}-${String(seq).padStart(6, "0")}`;
  }

  async checkChallanNoUnique(challanNo, isGst, challanType, userId) {
    if (!challanNo || typeof challanNo !== "string" || !challanNo.trim()) {
      throw ApiError.badRequest("challan_no is required");
    }
    const filter = {
      challan_no: challanNo.trim(),
      user_id: userId,
      is_gst: isGst,
    };
    if (challanType) filter.challan_type = challanType;
    const exists = await Challan.exists(filter);
    return { challan_no: challanNo.trim(), is_unique: !exists };
  }

  async createChallan(challanData, userId, isGst, challanType) {
    const {
      items,
      contact_id,
      date,
      label_id,
      label_name,
      from_bank,
      to_bank,
      challan_no: providedChallanNo,
    } = challanData;

    const printOption =
      Number(challanData?.print_option ?? challanData?.printOption ?? 2) === 1 ?
        1
      : 2;

    if (!contact_id) {
      throw ApiError.badRequest("Contact ID is required");
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw ApiError.badRequest("At least one item is required");
    }

    const itemIds = [
      ...new Set(items.map((item) => String(item.item_id || ""))),
    ].filter(Boolean);
    const dbItems = await Item.find({ _id: { $in: itemIds }, user_id: userId })
      .select("_id item_name is_gst")
      .lean();

    if (dbItems.length !== itemIds.length) {
      throw ApiError.badRequest(
        "One or more items are invalid or do not belong to your account",
      );
    }

    const itemMasterMap = new Map(
      dbItems.map((item) => [String(item._id), item]),
    );

    const normalizedFromBank = await this._normalizeBankPayload(
      from_bank,
      userId,
    );
    const normalizedToBank = await this._normalizeBankPayload(to_bank, userId);

    if (challanType === "sale") {
      const party = await Contact.findOne({
        _id: contact_id,
        user_id: userId,
        type: "party",
      })
        .select("label_ids")
        .lean();

      if (!party) {
        throw ApiError.badRequest("Party not found for sale challan");
      }

      const resolvedLabelId = await this._resolveLabelId({
        labelId: label_id,
        labelName: label_name,
        userId,
        contact: party,
        requiredForSale: true,
      });

      return this._createSaleChallan(
        items,
        challanData,
        contact_id,
        date,
        userId,
        isGst,
        itemMasterMap,
        resolvedLabelId,
        normalizedFromBank,
        normalizedToBank,
        printOption,
        providedChallanNo,
      );
    }

    const resolvedLabelId = await this._resolveLabelId({
      labelId: label_id,
      labelName: label_name,
      userId,
      requiredForSale: false,
    });

    return this._createPurchaseChallan(
      items,
      challanData,
      contact_id,
      date,
      userId,
      challanData.is_gst ?? isGst,
      itemMasterMap,
      resolvedLabelId,
      normalizedFromBank,
      normalizedToBank,
      printOption,
      providedChallanNo,
    );
  }

  async updateChallan(challanId, userId, isGst, updateData) {
    const challan = await Challan.findOne({
      _id: challanId,
      user_id: userId,
      is_gst: isGst,
      challan_type: "sale",
    });

    if (!challan) throw ApiError.notFound("Sale challan not found");

    if (challan.converted_to_bill) {
      throw ApiError.badRequest("Cannot update challan that is already billed");
    }

    const fields = {};

    // Whitelist allowed fields to prevent mass assignment
    const ALLOWED_FIELDS = [
      "items",
      "date",
      "remarks",
      "print_option",
      "gross_total",
      "grossTotal",
      "sub_total",
      "subTotal",
      "discount",
      "amount",
      "from_bank",
      "to_bank",
      "label_id",
      "label_name",
      "challan_no",
    ];
    for (const key of ALLOWED_FIELDS) {
      if (updateData[key] !== undefined) fields[key] = updateData[key];
    }

    if (updateData.items) {
      await stockService.restoreStock(challan.items, userId, challan.is_gst);
      const processedItems = this._processItems(
        updateData.items,
        challan.is_gst,
      );
      await stockService.deductStock(processedItems, userId, challan.is_gst);

      const totals = this._normalizeChallanTotals(updateData, processedItems);

      fields.items = processedItems;
      fields.gross_total = totals.gross_total;
      fields.sub_total = totals.sub_total;
      fields.discount = totals.discount;
      fields.amount = totals.amount;
    } else {
      if (
        updateData.gross_total !== undefined ||
        updateData.grossTotal !== undefined
      ) {
        fields.gross_total = toNumber(
          updateData.gross_total ?? updateData.grossTotal,
          "gross_total",
        );
      }
      if (
        updateData.sub_total !== undefined ||
        updateData.subTotal !== undefined
      ) {
        fields.sub_total = toNumber(
          updateData.sub_total ?? updateData.subTotal,
          "sub_total",
        );
      }
      if (updateData.discount !== undefined) {
        fields.discount = toNumber(updateData.discount, "discount");
      }
      if (updateData.amount !== undefined) {
        fields.amount = toNumber(updateData.amount, "amount");
      }
    }

    if (updateData.from_bank !== undefined) {
      fields.from_bank = await this._normalizeBankPayload(
        updateData.from_bank,
        userId,
      );
    }

    if (updateData.to_bank !== undefined) {
      fields.to_bank = await this._normalizeBankPayload(
        updateData.to_bank,
        userId,
      );
    }

    if (
      updateData.label_id !== undefined ||
      updateData.label_name !== undefined
    ) {
      const party = await Contact.findOne({
        _id: challan.contact_id,
        user_id: userId,
        type: "party",
      })
        .select("label_ids")
        .lean();

      fields.label_id = await this._resolveLabelId({
        labelId: updateData.label_id,
        labelName: updateData.label_name,
        userId,
        contact: party,
        requiredForSale: true,
      });
    }

    delete fields.label_name;
    delete fields.grossTotal;
    delete fields.subTotal;

    const updatedChallan = await Challan.findByIdAndUpdate(challanId, fields, {
      new: true,
    }).populate(this._challanPopulate());

    return this._attachLegacyLabelName(updatedChallan);
  }

  async deleteChallan(challanId, userId, isGst) {
    const challan = await Challan.findOne({
      _id: challanId,
      user_id: userId,
      is_gst: isGst,
    });

    if (!challan) throw ApiError.notFound("Challan not found");

    if (challan.challan_type === "sale" && challan.converted_to_bill) {
      throw ApiError.badRequest("Cannot delete challan that is already billed");
    }

    if (challan.challan_type === "sale") {
      await stockService.restoreStock(challan.items, userId, challan.is_gst);
    } else {
      await stockService.removeStock(challan.items, userId, challan.is_gst);
    }

    if (challan.linked_challan_id) {
      await Challan.findByIdAndUpdate(challan.linked_challan_id, {
        linked_challan_id: null,
      });
    }

    await Challan.findByIdAndDelete(challanId);
  }

  async getUnconvertedChallansForContact(contactId, userId, isGst) {
    const challans = await Challan.find({
      contact_id: contactId,
      user_id: userId,
      is_gst: isGst,
      challan_type: "sale",
      converted_to_bill: false,
    })
      .populate(this._challanPopulate())
      .sort({ createdAt: -1 })
      .lean();

    return this._attachLegacyLabelNames(challans);
  }

  async recordPayment(challanId, userId, amount) {
    const challan = await Challan.findOne({
      _id: challanId,
      user_id: userId,
      challan_type: "purchase",
    });
    if (!challan) throw ApiError.notFound("Purchase challan not found");

    const newPaidAmount = this._round(
      (challan.paid_amount || 0) + Number(amount || 0),
    );
    let paymentStatus = "overpaid";
    if (Math.abs(newPaidAmount - challan.amount) < 0.01) paymentStatus = "paid";
    else if (newPaidAmount < challan.amount) paymentStatus = "due";

    const updatedChallan = await Challan.findByIdAndUpdate(
      challanId,
      { paid_amount: newPaidAmount, payment_status: paymentStatus },
      { new: true },
    ).populate(this._challanPopulate());

    return this._attachLegacyLabelName(updatedChallan);
  }

  async _createSaleChallan(
    items,
    totalsInput,
    contact_id,
    date,
    userId,
    isGst,
    itemMasterMap,
    labelId,
    fromBank,
    toBank,
    printOption,
    providedChallanNo,
  ) {
    const gstItems = [];
    const nonGstItems = [];

    for (const item of items) {
      const masterItem = itemMasterMap.get(String(item.item_id));
      const masterIsGst = masterItem?.is_gst ?? 1;
      const saleIsGst = item.is_gst ?? item.isGst ?? masterIsGst;

      if (masterIsGst === 0 && Number(saleIsGst) === 1) {
        throw ApiError.badRequest(
          `Item ${item.item_id} is a NON_GST item and cannot be sold as GST`,
        );
      }

      const normalizedItem = {
        ...item,
        is_gst:
          masterIsGst === 0 ? 0
          : Number(saleIsGst) === 1 ? 1
          : 0,
      };

      if (normalizedItem.is_gst === 1) gstItems.push(normalizedItem);
      else nonGstItems.push(normalizedItem);
    }

    if (gstItems.length === 0 && nonGstItems.length === 0) {
      throw ApiError.badRequest("At least one item is required");
    }

    // if (isGst === 1 && gstItems.length === 0) {
    //   throw ApiError.badRequest(
    //     "No GST items found in this challan. Switch to NON_GST firm for these items.",
    //   );
    // }

    // if (isGst === 0 && nonGstItems.length === 0) {
    //   throw ApiError.badRequest(
    //     "No NON_GST items found in this challan. Switch to GST firm for these items.",
    //   );
    // }

    const hasMixedGroups = gstItems.length > 0 && nonGstItems.length > 0;

    let challanNoUsed = false;
    const buildChallanDoc = async (groupItems, challanIsGst) => {
      let challan_no;
      if (!challanNoUsed && providedChallanNo) {
        challan_no = await this._resolveChallanNo(
          providedChallanNo,
          `ChallanNo_${challanIsGst === 1 ? "GST" : "NONGST"}`,
          "CH",
          userId,
          challanIsGst,
          "sale",
        );
        challanNoUsed = true;
      } else {
        challan_no = await this._resolveChallanNo(
          null,
          `ChallanNo_${challanIsGst === 1 ? "GST" : "NONGST"}`,
          "CH",
          userId,
          challanIsGst,
          "sale",
        );
      }
      const nextId = await getNextId("Challan", userId);

      const processedItems = this._processItems(groupItems, challanIsGst);
      const totals =
        hasMixedGroups ?
          this._normalizeChallanTotals({}, processedItems)
        : this._normalizeChallanTotals(totalsInput, processedItems);

      return {
        doc: {
          id: nextId,
          challan_no,
          challan_type: "sale",
          contact_id,
          date: date || new Date(),
          label_id: labelId,
          print_option: printOption,
          from_bank: fromBank,
          to_bank: toBank,
          items: processedItems,
          gross_total: totals.gross_total,
          sub_total: totals.sub_total,
          discount: totals.discount,
          amount: totals.amount,
          is_gst: challanIsGst,
          user_id: userId,
        },
        processedItems,
      };
    };

    let gstChallan = null;
    let nonGstChallan = null;

    if (gstItems.length > 0) {
      const { doc, processedItems } = await buildChallanDoc(gstItems, 1);
      await stockService.deductStock(processedItems, userId, 1);
      gstChallan = await Challan.create(doc);
    }

    if (nonGstItems.length > 0) {
      const { doc, processedItems } = await buildChallanDoc(nonGstItems, 0);
      await stockService.deductStock(processedItems, userId, 0);
      nonGstChallan = await Challan.create(doc);
    }

    if (gstChallan && nonGstChallan) {
      await Challan.findByIdAndUpdate(gstChallan._id, {
        linked_challan_id: nonGstChallan._id,
      });
      await Challan.findByIdAndUpdate(nonGstChallan._id, {
        linked_challan_id: gstChallan._id,
      });
      gstChallan.linked_challan_id = nonGstChallan._id;
      nonGstChallan.linked_challan_id = gstChallan._id;
    }

    const currentFirmChallan = isGst === 1 ? gstChallan : nonGstChallan;
    const returnChallan = currentFirmChallan || gstChallan || nonGstChallan;

    if (!returnChallan) {
      throw ApiError.badRequest(
        "No challan could be created for the given items",
      );
    }

    const populated = await returnChallan.populate(this._challanPopulate());
    return this._attachLegacyLabelName(populated);
  }

  async _createPurchaseChallan(
    items,
    totalsInput,
    contact_id,
    date,
    userId,
    challanIsGst,
    _itemMasterMap,
    labelId,
    fromBank,
    toBank,
    printOption,
    providedChallanNo,
  ) {
    const supplier = await Contact.findOne({
      _id: contact_id,
      user_id: userId,
      type: "supplier",
    })
      .select("is_gst")
      .lean();
    if (!supplier) {
      throw ApiError.badRequest("Supplier not found");
    }

    const supplierIsGst = supplier.is_gst ?? 1;
    const challan_no = await this._resolveChallanNo(
      providedChallanNo,
      `PurchaseNo_${challanIsGst === 1 ? "GST" : "NONGST"}`,
      "PO",
      userId,
      challanIsGst,
      "purchase",
    );
    const nextId = await getNextId("Challan", userId);

    const processedItems = this._processItems(items, challanIsGst);
    const totals = this._normalizeChallanTotals(totalsInput, processedItems);

    await stockService.addStock(processedItems, userId, challanIsGst);

    const itemIds = [
      ...new Set(processedItems.map((item) => String(item.item_id))),
    ];
    await Item.updateMany(
      { _id: { $in: itemIds }, user_id: userId },
      { is_gst: supplierIsGst },
    );

    const challan = await Challan.create({
      id: nextId,
      challan_no,
      challan_type: "purchase",
      contact_id,
      date: date || new Date(),
      label_id: labelId || null,
      print_option: printOption,
      from_bank: fromBank,
      to_bank: toBank,
      items: processedItems,
      gross_total: totals.gross_total,
      sub_total: totals.sub_total,
      discount: totals.discount,
      amount: totals.amount,
      is_gst: challanIsGst,
      user_id: userId,
    });

    const populated = await challan.populate(this._challanPopulate());
    return this._attachLegacyLabelName(populated);
  }

  async getLastSoldItem(itemId, userId) {
    const challans = await Challan.find({
      user_id: userId,
      challan_type: "sale",
      "items.item_id": itemId,
    })
      .sort({ date: -1, createdAt: -1, _id: -1 })
      .populate("contact_id", "name phone type")
      .populate(
        "items.item_id",
        "item_name alias description hsn_id barcode item_id sale_rate purchase_rate mrp_rate gst_percent stock physical_stock logical_stock image is_gst",
      )
      .lean();

    if (challans.length === 0) return [];

    const normalizedItemId = String(itemId);
    const entries = [];

    for (const challan of challans) {
      for (const line of challan.items || []) {
        const lineItem = line?.item_id;
        const lineItemId =
          typeof lineItem === "object" && lineItem?._id ?
            String(lineItem._id)
          : String(lineItem);

        if (lineItemId !== normalizedItemId) continue;

        entries.push({
          challan_id: challan._id,
          challan_no: challan.challan_no,
          challan_date: challan.date,
          contact: challan.contact_id,
          is_gst: challan.is_gst,
          item: lineItem,
          quantity: line.quantity,
          rate: line.rate,
          discount: line.discount,
          special_discount: line.special_discount,
          discount_amount: line.discount_amount,
          gst_percent: line.gst_percent,
          gst_amount: line.gst_amount,
          taxable_amount: line.taxable_amount,
          amount: line.amount,
        });
      }
    }

    return entries.slice(0, 4);
  }
}

export default new ChallanService();
