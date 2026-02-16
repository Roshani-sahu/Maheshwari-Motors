import Challan from "../../models/transaction/challan.model.js";
import Item from "../../models/master/item.model.js";
import Discount from "../../models/master/discount.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";
import stockService from "../inventory/stock.service.js";

class ChallanService {
  async getChallans(userId, isGst, query) {
    const filter = {
      user_id: userId,
      is_gst: isGst,
      converted_to_bill: false,
    };

    if (query.party_id) filter.party_id = query.party_id;

    if (query.from_date || query.to_date) {
      filter.date = {};
      if (query.from_date) filter.date.$gte = new Date(query.from_date);
      if (query.to_date) filter.date.$lte = new Date(query.to_date);
    }

    return Pagination.paginate(Challan, filter, {
      ...query,
      populate: [
        { path: "party_id", select: "name phone" },
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
      .populate("party_id")
      .populate("items.item_id");

    if (!challan) throw ApiError.notFound("Challan not found");
    return challan;
  }

  async createChallan(challanData, userId, isGst) {
    const {
      items,
      discount: manualChallanDiscount,
      party_id,
      date,
    } = challanData;

    const itemIds = items.map((i) => i.item_id);
    const dbItems = await Item.find({ _id: { $in: itemIds } })
      .select("_id is_gst brand_id gst_percent sale_rate mrp_rate stock")
      .lean();
    const itemMasterMap = new Map(dbItems.map((i) => [i._id.toString(), i]));

    // Fetch discount master for all brands in these items
    const brandIds = [
      ...new Set(
        dbItems.filter((i) => i.brand_id).map((i) => i.brand_id.toString()),
      ),
    ];
    const brandDiscounts =
      brandIds.length > 0 ?
        await Discount.find({
          brand_id: { $in: brandIds },
          user_id: userId,
        }).lean()
      : [];
    const discountMap = new Map(
      brandDiscounts.map((d) => [d.brand_id.toString(), d]),
    );

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

      // Auto-apply discount from discount master if not explicitly provided
      const brandId = masterItem?.brand_id?.toString();
      const brandDiscount = brandId ? discountMap.get(brandId) : null;

      let disc = item.discount;
      let spDisc = item.special_discount;

      if (brandDiscount && disc === undefined && spDisc === undefined) {
        // Use discount1 for GST, discount2 for NON_GST
        const discountSet =
          saleIsGst === 1 ? brandDiscount.discount1 : brandDiscount.discount2;
        disc = discountSet?.normal ?? 0;
        spDisc = discountSet?.special ?? 0;
      } else {
        disc = disc ?? 0;
        spDisc = spDisc ?? 0;
      }

      // Auto-apply gst_percent from item master if not provided
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

      let grossTotal = 0;
      let subTotal = 0;

      const processedItems = groupItems.map((item) => {
        const grossAmount = item.quantity * item.rate;
        const disc = item.discount ?? 0;
        const spDisc = item.special_discount ?? 0;
        const manualDiscAmt = item.discount_amount ?? 0;
        const gstPct = item.gst_percent ?? 0;

        // Sequential discounts: first normal %, then special %, then flat amount
        const afterDisc = grossAmount * (1 - disc / 100);
        const afterSpDisc = afterDisc * (1 - spDisc / 100);
        const taxableAmount = afterSpDisc - manualDiscAmt;
        const totalDiscountAmount = grossAmount - taxableAmount;
        const gstAmount = taxableAmount * (gstPct / 100);
        const finalAmount = taxableAmount + gstAmount;

        grossTotal += grossAmount;
        subTotal += finalAmount;

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
          is_gst: item.is_gst,
        };
      });

      const challanDiscount = manualChallanDiscount ?? 0;
      const challanDiscountAmount = subTotal * (challanDiscount / 100);
      const totalAmount = subTotal - challanDiscountAmount;

      return {
        doc: {
          id: nextId,
          challan_no,
          party_id,
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
      { path: "party_id", select: "name" },
      { path: "items.item_id", select: "item_name" },
    ]);
  }

  async updateChallan(challanId, userId, isGst, updateData) {
    const challan = await Challan.findOne({
      _id: challanId,
      user_id: userId,
      is_gst: isGst,
    });

    if (!challan) throw ApiError.notFound("Challan not found");

    if (challan.converted_to_bill) {
      throw ApiError.badRequest("Cannot update challan that is already billed");
    }

    if (updateData.items) {
      if (challan.is_gst === 1) {
        await stockService.restoreStock(challan.items, userId);
      }

      let grossTotal = 0;
      let subTotal = 0;

      const processedItems = updateData.items.map((item) => {
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

        grossTotal += grossAmount;
        subTotal += finalAmount;

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
          is_gst: challan.is_gst,
        };
      });

      const discount = updateData.discount ?? challan.discount ?? 0;
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
      { path: "party_id", select: "name" },
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

    if (challan.converted_to_bill) {
      throw ApiError.badRequest("Cannot delete challan that is already billed");
    }

    if (challan.is_gst === 1) {
      await stockService.restoreStock(challan.items, userId);
    }

    if (challan.linked_challan_id) {
      await Challan.findByIdAndUpdate(challan.linked_challan_id, {
        linked_challan_id: null,
      });
    }

    await Challan.findByIdAndDelete(challanId);
  }

  async getUnconvertedChallansForParty(partyId, userId, isGst) {
    const challans = await Challan.find({
      party_id: partyId,
      user_id: userId,
      is_gst: isGst,
      converted_to_bill: false,
    })
      .populate("items.item_id", "item_name")
      .sort({ createdAt: -1 });

    return challans;
  }
}

export default new ChallanService();
