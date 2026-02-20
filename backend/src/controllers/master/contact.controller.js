import { contactService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const contactSchema = {
  name: {
    required: true,
    type: "string",
    min: 1,
    max: 200,
    label: "Contact name",
  },
  type: {
    required: true,
    type: "string",
    enum: ["party", "supplier"],
    label: "Contact type",
  },
  phone: {
    required: false,
    type: "string",
    format: "phone",
    label: "Phone number",
  },
  whatsapp_number: {
    required: false,
    type: "string",
    max: 20,
    label: "WhatsApp Number",
  },
  email: { required: false, type: "string", format: "email", label: "Email" },
  address: { required: false, type: "string", max: 500, label: "Address" },
  city: { required: false, type: "string", max: 100, label: "City" },
  state: { required: false, type: "string", max: 100, label: "State" },
  gstin: { required: false, type: "string", format: "gstin", label: "GSTIN" },
  cin: { required: false, type: "string", max: 50, label: "CIN" },
  reg_number: { required: false, type: "string", max: 50, label: "Reg Number" },
  bank_name: { required: false, type: "string", max: 100, label: "Bank Name" },
  bank_branch: {
    required: false,
    type: "string",
    max: 100,
    label: "Bank Branch",
  },
  ifsc_code: { required: false, type: "string", max: 20, label: "IFSC Code" },
  account_number: {
    required: false,
    type: "string",
    max: 30,
    label: "Account Number",
  },
  transport_charge: {
    required: false,
    type: "number",
    min: 0,
    label: "Transport Charge",
  },
  area: { required: false, type: "string", max: 200, label: "Area" },
  is_gst: {
    required: false,
    type: "number",
    enum: [0, 1],
    label: "flag (1=G, 0=N)",
  },
  category_id: {
    required: false,
    type: "objectId",
    label: "Category ID",
  },
  transport_id: {
    required: false,
    type: "objectId",
    nullable: true,
    label: "Transport ID",
  },
  agent_id: {
    required: false,
    type: "objectId",
    nullable: true,
    label: "Agent ID",
  },
  area_id: {
    required: false,
    type: "objectId",
    nullable: true,
    label: "Area ID",
  },
};

const updateBalanceSchema = {
  amount: { required: true, type: "number", min: 0, label: "Amount" },
  operation: {
    required: true,
    type: "string",
    enum: ["add", "subtract"],
    label: "Operation",
  },
};

export const getContacts = asyncHandler(async (req, res) => {
  const result = await contactService.getContacts(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Contacts fetched successfully"));
});

export const getParties = asyncHandler(async (req, res) => {
  const result = await contactService.getContacts(req.user._id, {
    ...req.query,
    type: "party",
  });
  res
    .status(200)
    .json(new ApiResponse(200, result, "Parties fetched successfully"));
});

export const getSuppliers = asyncHandler(async (req, res) => {
  const result = await contactService.getContacts(req.user._id, {
    ...req.query,
    type: "supplier",
  });
  res
    .status(200)
    .json(new ApiResponse(200, result, "Suppliers fetched successfully"));
});

export const getContactById = asyncHandler(async (req, res) => {
  const contact = await contactService.getContactById(
    req.params.contactId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, contact, "Contact fetched successfully"));
});

export const createContact = asyncHandler(async (req, res) => {
  const data = validate(req.body, contactSchema);
  const contact = await contactService.createContact(data, req.user._id);
  res
    .status(201)
    .json(new ApiResponse(201, contact, "Contact created successfully"));
});

export const updateContact = asyncHandler(async (req, res) => {
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

export const deleteContact = asyncHandler(async (req, res) => {
  await contactService.deleteContact(req.params.contactId, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Contact deleted successfully"));
});

export const getContactBalance = asyncHandler(async (req, res) => {
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

export const updateContactBalance = asyncHandler(async (req, res) => {
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

export const getContactsWithDue = asyncHandler(async (req, res) => {
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

export const getContactsWithOverpaid = asyncHandler(async (req, res) => {
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
