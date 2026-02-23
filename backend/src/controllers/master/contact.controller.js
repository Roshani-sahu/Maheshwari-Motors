import { contactService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

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
