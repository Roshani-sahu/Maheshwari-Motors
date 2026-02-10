import { partyService } from "../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../utils/index.js";

const partySchema = {
  name: {
    required: true,
    type: "string",
    min: 1,
    max: 200,
    label: "Party name",
  },
  phone: {
    required: false,
    type: "string",
    format: "phone",
    label: "Phone number",
  },
  email: { required: false, type: "string", format: "email", label: "Email" },
  address: { required: false, type: "string", max: 500, label: "Address" },
  city: { required: false, type: "string", max: 100, label: "City" },
  state: { required: false, type: "string", max: 100, label: "State" },
  gstin: { required: false, type: "string", format: "gstin", label: "GSTIN" },
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

export const getParties = asyncHandler(async (req, res) => {
  const result = await partyService.getParties(
    req.params.firmId,
    req.firmOwnerId,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Parties fetched successfully"));
});

export const getPartyById = asyncHandler(async (req, res) => {
  const party = await partyService.getPartyById(
    req.params.partyId,
    req.params.firmId,
    req.firmOwnerId,
  );
  res
    .status(200)
    .json(new ApiResponse(200, party, "Party fetched successfully"));
});

export const createParty = asyncHandler(async (req, res) => {
  const data = validate(req.body, partySchema);
  const party = await partyService.createParty(
    data,
    req.params.firmId,
    req.firmOwnerId,
  );
  res
    .status(201)
    .json(new ApiResponse(201, party, "Party created successfully"));
});

export const updateParty = asyncHandler(async (req, res) => {
  const data = validate(req.body, partySchema, { allowPartial: true });
  const party = await partyService.updateParty(
    req.params.partyId,
    req.params.firmId,
    req.firmOwnerId,
    data,
  );
  res
    .status(200)
    .json(new ApiResponse(200, party, "Party updated successfully"));
});

export const deleteParty = asyncHandler(async (req, res) => {
  await partyService.deleteParty(
    req.params.partyId,
    req.params.firmId,
    req.firmOwnerId,
  );
  res
    .status(200)
    .json(new ApiResponse(200, null, "Party deleted successfully"));
});

export const getPartyBalance = asyncHandler(async (req, res) => {
  const balance = await partyService.getPartyBalance(
    req.params.partyId,
    req.params.firmId,
    req.firmOwnerId,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, { balance }, "Party balance fetched successfully"),
    );
});

export const updatePartyBalance = asyncHandler(async (req, res) => {
  const { amount, operation } = validate(req.body, updateBalanceSchema);
  const balance = await partyService.updateBalance(
    req.params.partyId,
    req.params.firmId,
    req.firmOwnerId,
    amount,
    operation,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, { balance }, "Party balance updated successfully"),
    );
});

export const getPartiesWithDue = asyncHandler(async (req, res) => {
  const result = await partyService.getParties(
    req.params.firmId,
    req.firmOwnerId,
    { ...req.query, balance_status: "due" },
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Parties with due amount fetched successfully",
      ),
    );
});

export const getPartiesWithOverpaid = asyncHandler(async (req, res) => {
  const result = await partyService.getParties(
    req.params.firmId,
    req.firmOwnerId,
    { ...req.query, balance_status: "overpaid" },
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Parties with overpaid amount fetched successfully",
      ),
    );
});
