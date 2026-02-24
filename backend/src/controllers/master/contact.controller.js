import { contactService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const discountFieldSchema = {
  required: false,
  type: "object",
  fields: {
    normal: { required: false, type: "number", min: 0, max: 100, label: "Normal discount" },
    special: { required: false, type: "number", min: 0, max: 100, label: "Special discount" },
  },
};

const bankSchema = {
  required: false,
  type: "array",
  label: "Banks",
  items: {
    bank_name: { required: true, type: "string", min: 1, label: "Bank name" },
    bank_branch: { required: false, type: "string", label: "Bank branch" },
    ifsc_code: { required: false, type: "string", label: "IFSC" },
    account_number: { required: true, type: "string", min: 1, label: "Account number" },
    account_holder: { required: false, type: "string", label: "Account holder" },
    upi_id: { required: false, type: "string", label: "UPI ID" },
    is_default: { required: false, type: "boolean", label: "Default bank" },
  },
};

const itemDiscountSchema = {
  required: false,
  type: "array",
  label: "Item discounts",
  items: {
    item_id: { required: true, type: "objectId", label: "Item" },
    discount1: discountFieldSchema,
    discount2: discountFieldSchema,
  },
};

const contactSchema = {
  name: { required: true, type: "string", min: 1, label: "Name" },
  alias: { required: false, type: "string", label: "Alias" },
  type: { required: true, type: "string", enum: ["party", "supplier"], label: "Type" },
  phone: { required: false, type: "string", label: "Phone" },
  whatsapp_number: { required: false, type: "string", label: "WhatsApp number" },
  email: { required: false, type: "string", format: "email", label: "Email" },
  address: { required: false, type: "string", label: "Address" },
  city: { required: false, type: "string", label: "City" },
  state: { required: false, type: "string", label: "State" },
  gstin: { required: false, type: "string", label: "GSTIN" },
  cin: { required: false, type: "string", label: "CIN" },
  reg_number: { required: false, type: "string", label: "Registration number" },
  signature: { required: false, type: "string", label: "Signature image" },
  assigned_label: { required: false, type: "string", label: "Assigned label" },
  banks: bankSchema,
  item_discounts: itemDiscountSchema,
  bank_name: { required: false, type: "string", label: "Bank name" },
  bank_branch: { required: false, type: "string", label: "Bank branch" },
  ifsc_code: { required: false, type: "string", label: "IFSC" },
  account_number: { required: false, type: "string", label: "Account number" },
  transport_charge: { required: false, type: "number", min: 0, label: "Transport charge" },
  area: { required: false, type: "string", label: "Area" },
  is_gst: { required: false, type: "number", enum: [0, 1], label: "GST flag" },
  category_id: { required: false, type: "objectId", label: "Category" },
  transport_id: { required: false, type: "objectId", label: "Transport" },
  agent_id: { required: false, type: "objectId", label: "Agent" },
  area_id: { required: false, type: "objectId", label: "Area master" },
};

const updateBalanceSchema = {
  amount: { required: true, type: "number", min: 0.01, label: "Amount" },
  operation: { required: true, type: "string", enum: ["add", "subtract"], label: "Operation" },
};

class ContactController {
  getContacts = asyncHandler(async (req, res) => {
    const result = await contactService.getContacts(req.user._id, req.query);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Contacts fetched successfully"));
  });

  getParties = asyncHandler(async (req, res) => {
    const result = await contactService.getContacts(req.user._id, {
      ...req.query,
      type: "party",
    });
    res
      .status(200)
      .json(new ApiResponse(200, result, "Parties fetched successfully"));
  });

  getSuppliers = asyncHandler(async (req, res) => {
    const result = await contactService.getContacts(req.user._id, {
      ...req.query,
      type: "supplier",
    });
    res
      .status(200)
      .json(new ApiResponse(200, result, "Suppliers fetched successfully"));
  });

  getContactById = asyncHandler(async (req, res) => {
    const contact = await contactService.getContactById(
      req.params.contactId,
      req.user._id,
    );
    res
      .status(200)
      .json(new ApiResponse(200, contact, "Contact fetched successfully"));
  });

  createContact = asyncHandler(async (req, res) => {
    const data = validate(req.body, contactSchema);
    const contact = await contactService.createContact(data, req.user._id);
    res
      .status(201)
      .json(new ApiResponse(201, contact, "Contact created successfully"));
  });

  updateContact = asyncHandler(async (req, res) => {
    const data = validate(req.body, contactSchema, { allowPartial: true });
    const contact = await contactService.updateContact(
      req.params.contactId,
      req.user._id,
      data,
    );
    res
      .status(200)
      .json(new ApiResponse(200, contact, "Contact updated successfully"));
  });

  deleteContact = asyncHandler(async (req, res) => {
    await contactService.deleteContact(req.params.contactId, req.user._id);
    res
      .status(200)
      .json(new ApiResponse(200, null, "Contact deleted successfully"));
  });

  getContactBalance = asyncHandler(async (req, res) => {
    const balance = await contactService.getContactBalance(
      req.params.contactId,
      req.user._id,
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, { balance }, "Contact balance fetched successfully"),
      );
  });

  updateContactBalance = asyncHandler(async (req, res) => {
    const { amount, operation } = validate(req.body, updateBalanceSchema);
    const balance = await contactService.updateBalance(
      req.params.contactId,
      req.user._id,
      amount,
      operation,
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, { balance }, "Contact balance updated successfully"),
      );
  });

  getContactsWithDue = asyncHandler(async (req, res) => {
    const result = await contactService.getContacts(req.user._id, {
      ...req.query,
      balance_status: "due",
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Contacts with due amount fetched successfully",
        ),
      );
  });

  getContactsWithOverpaid = asyncHandler(async (req, res) => {
    const result = await contactService.getContacts(req.user._id, {
      ...req.query,
      balance_status: "overpaid",
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Contacts with overpaid amount fetched successfully",
        ),
      );
  });
}

const contactController = new ContactController();

export const getContacts = contactController.getContacts;
export const getParties = contactController.getParties;
export const getSuppliers = contactController.getSuppliers;
export const getContactById = contactController.getContactById;
export const createContact = contactController.createContact;
export const updateContact = contactController.updateContact;
export const deleteContact = contactController.deleteContact;
export const getContactBalance = contactController.getContactBalance;
export const updateContactBalance = contactController.updateContactBalance;
export const getContactsWithDue = contactController.getContactsWithDue;
export const getContactsWithOverpaid = contactController.getContactsWithOverpaid;

export default contactController;
