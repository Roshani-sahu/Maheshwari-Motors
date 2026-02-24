export const getResponseData = (response) => {
  if (!response) return null;
  return response?.data?.data ?? response?.data ?? null;
};

export const getResponseList = (response) => {
  const payload = getResponseData(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const getResponseMeta = (response) => {
  const payload = getResponseData(response);
  return payload?.meta ?? payload?.pagination ?? null;
};

export const getEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id || value?.id || "";
};

export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeCategory = (category = {}) => ({
  id: getEntityId(category),
  name: category?.category_name || category?.name || "",
  brandIds: (category?.brands || category?.brand_ids || [])
    .map((brand) => getEntityId(brand))
    .filter(Boolean),
  raw: category,
});

export const normalizeBrand = (brand = {}) => ({
  id: getEntityId(brand),
  name: brand?.brand_name || brand?.name || "",
  hsnId: getEntityId(brand?.hsn_id),
  totalItems: toNumber(brand?.total_items ?? brand?.itemCount, 0),
  discount1: brand?.discount1 || { normal: 0, special: 0 },
  discount2: brand?.discount2 || { normal: 0, special: 0 },
  raw: brand,
});

export const normalizeContact = (contact = {}) => ({
  id: getEntityId(contact),
  name: contact?.name || "",
  alias: contact?.alias || "",
  type: contact?.type || "",
  phone: contact?.phone || "",
  whatsapp_number: contact?.whatsapp_number || "",
  email: contact?.email || "",
  address: contact?.address || "",
  city: contact?.city || "",
  state: contact?.state || "",
  gstin: contact?.gstin || "",
  is_gst: toNumber(contact?.is_gst, 0) === 1 ? 1 : 0,
  category_id: getEntityId(contact?.category_id),
  transport_id: getEntityId(contact?.transport_id),
  area_id: getEntityId(contact?.area_id),
  agent_id: getEntityId(contact?.agent_id),
  cin: contact?.cin || "",
  reg_number: contact?.reg_number || "",
  bank_name: contact?.bank_name || "",
  bank_branch: contact?.bank_branch || "",
  ifsc_code: contact?.ifsc_code || "",
  account_number: contact?.account_number || "",
  transport_charge: contact?.transport_charge || "",
  raw: contact,
});

export const normalizeItem = (item = {}) => ({
  id: getEntityId(item),
  itemName: item?.item_name || item?.name || "",
  barcode: item?.barcode || item?.barcode_no || item?.barcodeNumber || item?.barcode_value || "",
  amount: toNumber(item?.sale_rate ?? item?.amount ?? item?.rate, 0),
  purchase_rate: toNumber(item?.purchase_rate, 0),
  mrp_rate: toNumber(item?.mrp_rate, 0),
  gst_percent: toNumber(item?.gst_percent, 0),
  discount: toNumber(item?.discount, 0),
  stockCount: toNumber(
    item?.stock ??
      item?.current_stock ??
      item?.opening_stock ??
      item?.physical_stock ??
      item?.quantity,
    0,
  ),
  threshold: toNumber(item?.threshold ?? item?.low_stock_threshold, 0),
  type: toNumber(item?.is_gst, 0) === 1 ? 1 : 0,
  categoryId: getEntityId(item?.category_id || item?.category_ids?.[0]),
  brandId: getEntityId(item?.brand_id),
  supplierId: getEntityId(item?.contact_id || item?.supplier_id),
  itemMedia: item?.image || "",
  raw: item,
});

export const normalizeChallan = (challan = {}) => ({
  id: getEntityId(challan),
  challanNo: challan?.challan_no || challan?.challanNo || "",
  date: challan?.date || null,
  partyId: getEntityId(challan?.contact_id || challan?.party_id),
  party: challan?.contact_id?.name || challan?.party_id?.name || challan?.party_name || "Unknown",
  items:
    challan?.items?.map(
      (item) =>
        item?.item_id?.item_name ||
        item?.item_id?.name ||
        item?.item_name ||
        "Item",
    ) || [],
  amount: toNumber(challan?.amount, 0),
  gstType: toNumber(challan?.is_gst, 0) === 1 ? 1 : 0,
  converted_to_bill: Boolean(challan?.converted_to_bill),
  payment_status: challan?.payment_status || "",
  printOption: challan?.print_option || 1,
  raw: challan,
});

export const normalizeBill = (bill = {}) => ({
  id: getEntityId(bill),
  billNo: bill?.bill_no || bill?.billNo || "",
  date: bill?.date || null,
  partyId: getEntityId(bill?.contact_id || bill?.party_id),
  party: bill?.contact_id?.name || bill?.party_id?.name || "Unknown",
  amount: toNumber(bill?.amount ?? bill?.total_amount, 0),
  gstType: toNumber(bill?.is_gst, 0) === 1 ? 1 : 0,
  payment_status: bill?.payment_status || "",
  linkedChallans:
    bill?.challan_ids?.map((challan) =>
      typeof challan === "string"
        ? challan
        : challan?.challan_no || getEntityId(challan),
    ) || [],
  raw: bill,
});
