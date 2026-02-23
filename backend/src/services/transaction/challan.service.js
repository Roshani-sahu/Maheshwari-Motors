import Challan from "../../models/transaction/challan.model.js";
import Item from "../../models/master/item.model.js";
import Brand from "../../models/master/brand.model.js";
import Contact from "../../models/master/contact.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";
import stockService from "../inventory/stock.service.js";

class ChallanService {
  async getChallans(userId, isGst, challanType, query) {
    const filter = {
      user_id: userId,
    };

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

    return Pagination.paginate(Challan, filter, {
      ...query,
      populate: [
        { path: "contact_id", select: "name phone type" },
        { path: "items.item_id", select: "item_name" },
      ],
      sort: { createdAt: -1 },
    });
  }

  async getChallanById(challanId, userId, isGst) {
    const challan = await Challan.findOne({
      _id: challanId,
      user_id: userId,
      is_gst: isGst,
    })
      .populate("contact_id")
      .populate("items.item_id");

    if (!challan) throw ApiError.notFound("Challan not found");
    return challan;
  }

  async createChallan(challanData, userId, isGst, challanType) {
    const {
      items,
      discount: manualChallanDiscount,
      contact_id,
      date,
    } = challanData;

    if (!contact_id) {
      throw ApiError.badRequest("Contact ID is required");
    }

    const itemIds = items.map((i) => i.item_id);
    const dbItems = await Item.find({ _id: { $in: itemIds } })
      .select("_id is_gst brand_id gst_percent sale_rate mrp_rate stock")
      .lean();
    const itemMasterMap = new Map(dbItems.map((i) => [i._id.toString(), i]));

    const brandIds = [
      ...new Set(
        dbItems.filter((i) => i.brand_id).map((i) => i.brand_id.toString()),
      ),
    ];
    const brands =
      brandIds.length > 0 ?
        await Brand.find({
          _id: { $in: brandIds },
          user_id: userId,
        })
          .select("_id discount1 discount2")
          .lean()
      : [];
    const discountMap = new Map(brands.map((b) => [b._id.toString(), b]));

    if (challanType === "sale") {
      return this._createSaleChallan(
        items,
        manualChallanDiscount,
        contact_id,
        date,
        userId,
        isGst,
        itemMasterMap,
        discountMap,
      );
    }

    return this._createPurchaseChallan(
      items,
      contact_id,
      date,
      userId,
      challanData.is_gst ?? isGst,
      itemMasterMap,
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

    if (updateData.items) {
      if (challan.is_gst === 1) {
        await stockService.restoreStock(challan.items, userId);
      }

      const processedItems = this._processItems(
        updateData.items,
        challan.is_gst,
      );

      const discount = updateData.discount ?? challan.discount ?? 0;
      const subTotal = processedItems.reduce((s, i) => s + i.amount, 0);
      const grossTotal = processedItems.reduce((s, i) => s + i.gross_amount, 0);
      const challanDiscountAmount = subTotal * (discount / 100);
      const totalAmount = subTotal - challanDiscountAmount;

      if (challan.is_gst === 1) {
        await stockService.deductStock(processedItems, userId);
      }

      updateData.items = processedItems;
      updateData.gross_total = grossTotal;
      updateData.sub_total = subTotal;
      updateData.discount = discount;
      updateData.amount = totalAmount;
    } else if (updateData.discount !== undefined) {
      const challanDiscountAmount =
        challan.sub_total * (updateData.discount / 100);
      updateData.amount = challan.sub_total - challanDiscountAmount;
    }

    const updatedChallan = await Challan.findByIdAndUpdate(
      challanId,
      updateData,
      { new: true },
    ).populate([
      { path: "contact_id", select: "name type" },
      { path: "items.item_id", select: "item_name" },
    ]);

    return updatedChallan;
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

    if (challan.is_gst === 1 || challan.challan_type === "purchase") {
      if (challan.challan_type === "sale") {
        await stockService.restoreStock(challan.items, userId);
      } else {
        await stockService.removeStock(challan.items, userId);
      }
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
      .populate("items.item_id", "item_name")
      .sort({ createdAt: -1 });

    return challans;
  }

  async recordPayment(challanId, userId, amount) {
    const challan = await Challan.findOne({
      _id: challanId,
      user_id: userId,
      challan_type: "purchase",
    });
    if (!challan) throw ApiError.notFound("Purchase challan not found");

    const newPaidAmount =
      Math.round((challan.paid_amount + amount) * 100) / 100;
    let paymentStatus;
    if (Math.abs(newPaidAmount - challan.amount) < 0.01) paymentStatus = "paid";
    else if (newPaidAmount < challan.amount) paymentStatus = "due";
    else paymentStatus = "overpaid";

    const updatedChallan = await Challan.findByIdAndUpdate(
      challanId,
      { paid_amount: newPaidAmount, payment_status: paymentStatus },
      { new: true },
    ).populate("contact_id", "name type");

    return updatedChallan;
  }

  _processItems(items, challanIsGst) {
    return items.map((item) => {
      const grossAmount = item.quantity * item.rate;
      const disc = item.discount ?? 0;
      const spDisc = item.special_discount ?? 0;
      const manualDiscAmt = item.discount_amount ?? 0;
      const gstPct = item.gst_percent ?? 0;

      const afterDisc = grossAmount * (1 - disc / 100);
      const afterSpDisc = afterDisc * (1 - spDisc / 100);
      const taxableAmount = afterSpDisc - manualDiscAmt;
      const totalDiscountAmount = grossAmount - taxableAmount;
      const gstAmount = taxableAmount * (gstPct / 100);
      const finalAmount = taxableAmount + gstAmount;

      return {
        item_id: item.item_id,
        quantity: item.quantity,
        rate: item.rate,
        discount: disc,
        special_discount: spDisc,
        discount_amount: manualDiscAmt,
        gross_amount: grossAmount,
        total_discount: totalDiscountAmount,
        taxable_amount: taxableAmount,
        gst_percent: gstPct,
        gst_amount: gstAmount,
        amount: finalAmount,
        is_gst: item.is_gst ?? challanIsGst,
      };
    });
  }

  async _createSaleChallan(
    items,
    manualChallanDiscount,
    contact_id,
    date,
    userId,
    isGst,
    itemMasterMap,
    discountMap,
  ) {
    const gstItems = [];
    const nonGstItems = [];

    for (const item of items) {
      const masterItem = itemMasterMap.get(
        item.item_id.toString?.() ?? item.item_id,
      );
      const masterIsGst = masterItem?.is_gst ?? 1;
      const saleIsGst = item.is_gst ?? masterIsGst ?? 1;

      if (masterIsGst === 0 && saleIsGst === 1) {
        throw ApiError.badRequest(
          `Item ${item.item_id} is a NON_GST item and cannot be sold as GST`,
        );
      }

      const brandId = masterItem?.brand_id?.toString();
      const brandData = brandId ? discountMap.get(brandId) : null;

      let disc = item.discount;
      let spDisc = item.special_discount;

      if (brandData && disc === undefined && spDisc === undefined) {
        const discountSet =
          saleIsGst === 1 ? brandData.discount1 : brandData.discount2;
        disc = discountSet?.normal ?? 0;
        spDisc = discountSet?.special ?? 0;
      } else {
        disc = disc ?? 0;
        spDisc = spDisc ?? 0;
      }

      const gstPct = item.gst_percent ?? masterItem?.gst_percent ?? 0;

      const enrichedItem = {
        ...item,
        is_gst: saleIsGst,
        discount: disc,
        special_discount: spDisc,
        gst_percent: gstPct,
      };

      if (saleIsGst === 1) {
        gstItems.push(enrichedItem);
      } else {
        nonGstItems.push(enrichedItem);
      }
    }

    if (gstItems.length === 0 && nonGstItems.length === 0) {
      throw ApiError.badRequest("At least one item is required");
    }

    const buildChallanDoc = async (groupItems, challanIsGst) => {
      const challanNoSeq = await getNextId(
        `ChallanNo_${challanIsGst === 1 ? "GST" : "NONGST"}`,
        userId,
      );
      const challan_no = `CH-${String(challanNoSeq).padStart(6, "0")}`;
      const nextId = await getNextId("Challan", userId);

      const processedItems = this._processItems(groupItems, challanIsGst);
      const grossTotal = processedItems.reduce((s, i) => s + i.gross_amount, 0);
      const subTotal = processedItems.reduce((s, i) => s + i.amount, 0);

      const challanDiscount = manualChallanDiscount ?? 0;
      const challanDiscountAmount = subTotal * (challanDiscount / 100);
      const totalAmount = subTotal - challanDiscountAmount;

      return {
        doc: {
          id: nextId,
          challan_no,
          challan_type: "sale",
          contact_id,
          date: date || new Date(),
          items: processedItems,
          gross_total: grossTotal,
          sub_total: subTotal,
          discount: challanDiscount,
          amount: totalAmount,
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
      await stockService.deductStock(processedItems, userId);
      gstChallan = await Challan.create(doc);
    }

    if (nonGstItems.length > 0) {
      const { doc } = await buildChallanDoc(nonGstItems, 0);
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

    return returnChallan.populate([
      { path: "contact_id", select: "name type" },
      { path: "items.item_id", select: "item_name" },
    ]);
  }

  async _createPurchaseChallan(
    items,
    contact_id,
    date,
    userId,
    challanIsGst,
    itemMasterMap,
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

    const challanNoSeq = await getNextId(
      `PurchaseNo_${challanIsGst === 1 ? "GST" : "NONGST"}`,
      userId,
    );
    const challan_no = `PO-${String(challanNoSeq).padStart(6, "0")}`;
    const nextId = await getNextId("Challan", userId);

    const processedItems = this._processItems(items, challanIsGst);
    const grossTotal = processedItems.reduce((s, i) => s + i.gross_amount, 0);
    const subTotal = processedItems.reduce((s, i) => s + i.amount, 0);

    await stockService.addStock(items, userId);

    const itemIds = items.map((i) => i.item_id);
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
      items: processedItems,
      gross_total: grossTotal,
      sub_total: subTotal,
      discount: 0,
      amount: subTotal,
      is_gst: challanIsGst,
      user_id: userId,
    });

    return challan.populate([
      { path: "contact_id", select: "name type" },
      { path: "items.item_id", select: "item_name" },
    ]);
  }
  async getLastSoldItem(itemId, userId) {
    const challan = await Challan.findOne({
      user_id: userId,
      challan_type: "sale",
      "items.item_id": itemId,
    })
      .sort({ date: -1, createdAt: -1 })
      .populate("contact_id", "name phone type")
      .populate(
        "items.item_id",
        "item_name barcode item_id sale_rate purchase_rate mrp_rate gst_percent stock image is_gst",
      )
      .lean();

    if (!challan) return null;

    const soldItem = challan.items.find(
      (i) => i.item_id?._id?.toString() === itemId.toString(),
    );

    return {
      challan_id: challan._id,
      challan_no: challan.challan_no,
      challan_date: challan.date,
      contact: challan.contact_id,
      is_gst: challan.is_gst,
      item: soldItem,
    };
  }
}

export default new ChallanService();
