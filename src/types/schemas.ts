import { z } from "zod";
import { SUPPORTED_OPERATIONS } from "./index.js";

/**
 * Form ID schema definition
 */
export const FormIdSchema = z.string().min(1);

/**
 * Form URL schema definition
 */
export const FormUrlSchema = z.string().url();

/**
 * Form item type schema
 */
export const ItemTypeSchema = z
  .enum(["text", "question", "pageBreak", "questionGroup"])
  .describe("Type of item to create");

/**
 * Question type schema
 */
export const QuestionTypeSchema = z
  .enum(["TEXT", "PARAGRAPH_TEXT", "RADIO", "CHECKBOX", "DROP_DOWN"])
  .describe("Type of question");

/**
 * Go To Action type for branching schema
 */
export const GoToActionSchema = z
  .enum(["NEXT_SECTION", "RESTART_FORM", "SUBMIT_FORM"])
  .describe("Type of branching action");

/**
 * Option with branching capability schema
 */
export const FormOptionSchema = z.object({
  value: z.string().describe("Option text value"),
  goToAction: GoToActionSchema.optional().describe("Branching action to take when this option is selected"),
  goToSectionId: z.string().optional().describe("Section ID to navigate to when this option is selected")
}).describe("Form option with optional branching capability");

/**
 * Operation type schema
 */
export const OperationTypeSchema = z
  .enum(SUPPORTED_OPERATIONS)
  .describe("Type of operation to execute");

/**
 * Schema for a row in a question group
 */
export const QuestionGroupRowSchema = z.object({
  title: z.string().describe("Row title"),
  required: z.boolean().optional().describe("Whether this row is required")
});


/**
 * Schema for create item request in batch operations
 */
export const CreateItemRequestSchema = z.object({
  item_id: z.string().optional().describe("Item ID (optional). Useful for section logic branching)"),
  title: z.string().describe("Item title"),
  description: z.string().optional().describe("Item description"),
  index: z.number().optional().describe("Insertion position (appends to the end if omitted)"),
  item_type: ItemTypeSchema.describe("Type of item to create"),
  question_type: QuestionTypeSchema.optional().describe("Type of question (required when creating question items)"),
  options: z.array(FormOptionSchema).optional().describe("List of options with optional branching logic"),
  required: z.boolean().optional().describe("Whether the question is required"),
  include_other: z.boolean().optional().describe("Whether to include an 'Other' option"),
  // For question_group only
  rows: z.array(QuestionGroupRowSchema).optional().describe("Rows for question groups"),
  isGrid: z.boolean().optional().describe("Whether this is a grid-style question group"),
  columns: z.array(FormOptionSchema).optional().describe("Columns for grid-style question groups"),
  gridType: z.enum(["CHECKBOX", "RADIO"]).optional().describe("Selection type for grid questions"),
  shuffleQuestions: z.boolean().optional().describe("Whether to shuffle questions in the group")
}).describe("Request object for creating an item");

/**
 * Schema for update item request in batch operations
 */
export const UpdateItemRequestSchema = z.object({
  item: z.any().describe("Full item object after update"),
  index: z.number().describe("Index of the item to update"),
  update_mask: z.string().describe(`A comma-separated list of fully qualified names of fields. Example: "user.displayName,photo"`),
}).describe("Request object for updating an item");

/**
 * Schema for delete item request in batch operations
 */
export const DeleteItemRequestSchema = z.object({
  index: z.number().describe("Index of the item to delete")
}).describe("Request object for deleting an item");

/**
 * Schema for move item request in batch operations
 */
export const MoveItemRequestSchema = z.object({
  index: z.number().describe("Original index of the item to move"),
  new_index: z.number().describe("Destination index for the item")
}).describe("Request object for moving an item");

/**
 * Schema for update form info request in batch operations
 */
export const UpdateFormInfoRequestSchema = z.object({
  title: z.string().optional().describe("New form title"),
  description: z.string().optional().describe("New form description")
}).describe("Request object for updating form information");

/**
 * Schema for a single batch operation
 */
export const BatchOperationSchema = z.object({
  // Operation type
  operation: OperationTypeSchema,
  createItemRequest: CreateItemRequestSchema.optional(),
  updateItemRequest: UpdateItemRequestSchema.optional(),
  deleteItemRequest: DeleteItemRequestSchema.optional(),
  moveItemRequest: MoveItemRequestSchema.optional(),
  updateFormInfoRequest: UpdateFormInfoRequestSchema.optional(),
});

/**
 * Schema for batch update form parameters
 */
export const BatchUpdateFormSchema = z.object({
  form_url: FormUrlSchema.describe(
    "Google Forms URL (example: https://docs.google.com/forms/d/e/FORM_ID/edit)",
  ),
  operations: z.array(BatchOperationSchema).describe("List of operations to execute"),
});
