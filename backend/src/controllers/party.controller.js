import { partyService } from "../services/index.js";
import { asyncHandler, ApiResponse } from "../utils/index.js";

export const getParties = asyncHandler(async (req, res) => {
  const result = await partyService.getParties(
    req.params.firmId,
    req.user._id,
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
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, party, "Party fetched successfully"));
});

export const createParty = asyncHandler(async (req, res) => {
  const party = await partyService.createParty(
    req.body,
    req.params.firmId,
    req.user._id,
  );
  res
    .status(201)
    .json(new ApiResponse(201, party, "Party created successfully"));
});

export const updateParty = asyncHandler(async (req, res) => {
  const party = await partyService.updateParty(
    req.params.partyId,
    req.params.firmId,
    req.user._id,
    req.body,
  );
  res
    .status(200)
    .json(new ApiResponse(200, party, "Party updated successfully"));
});

export const deleteParty = asyncHandler(async (req, res) => {
  await partyService.deleteParty(
    req.params.partyId,
    req.params.firmId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, null, "Party deleted successfully"));
});

export const getPartyBalance = asyncHandler(async (req, res) => {
  const balance = await partyService.getPartyBalance(
    req.params.partyId,
    req.params.firmId,
    req.user._id,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, { balance }, "Party balance fetched successfully"),
    );
});

export const updatePartyBalance = asyncHandler(async (req, res) => {
  const { amount, operation } = req.body;
  const balance = await partyService.updateBalance(
    req.params.partyId,
    req.params.firmId,
    req.user._id,
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
    req.user._id,
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
    req.user._id,
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
