import { agentService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

export const getAgents = asyncHandler(async (req, res) => {
  const result = await agentService.getAgents(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Agents fetched successfully"));
});

export const getAgentById = asyncHandler(async (req, res) => {
  const agent = await agentService.getAgentById(
    req.params.agentId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, agent, "Agent fetched successfully"));
});

export const createAgent = asyncHandler(async (req, res) => {
  const data = validate(req.body, agentSchema);
  const agent = await agentService.createAgent(data, req.user._id);
  res
    .status(201)
    .json(new ApiResponse(201, agent, "Agent created successfully"));
});

export const updateAgent = asyncHandler(async (req, res) => {
  const data = validate(req.body, agentSchema, { allowPartial: true });
  const agent = await agentService.updateAgent(
    req.params.agentId,
    req.user._id,
    data,
  );
  res
    .status(200)
    .json(new ApiResponse(200, agent, "Agent updated successfully"));
});

export const deleteAgent = asyncHandler(async (req, res) => {
  await agentService.deleteAgent(req.params.agentId, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Agent deleted successfully"));
});
