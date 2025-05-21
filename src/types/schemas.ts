import { z } from "zod";

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
export const FormOptionSchema = z
  .object({
    value: z.string().describe("Option text value"),
    goToAction: GoToActionSchema.optional().describe(
      "Branching action to take when this option is selected",
    ),
    goToSectionId: z
      .string()
      .optional()
      .describe("Section ID to navigate to when this option is selected. You can first create a section and then use the section ID here."),
  })
  .describe("Form option with optional branching capability");

/**
* Supported operations for batch updates
*/
export const SUPPORTED_OPERATIONS = [
  "create_item",
  "update_item",
  "delete_item",
  "move_item",
  "update_form_info",
  "update_form_settings",
] as const;

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
  required: z.boolean().optional().describe("Whether this row is required"),
});

/**
 * Schema for question group specific parameters
 */
const QuestionGroupParamsSchema = z.object({
  rows: z.array(QuestionGroupRowSchema).optional().describe("Rows for question groups"),
  is_grid: z.boolean().optional().describe("Whether this is a grid-style question group"),
  columns: z
    .array(FormOptionSchema)
    .optional()
    .describe("Columns for grid-style question groups"),
  grid_type: z
    .enum(["CHECKBOX", "RADIO"])
    .optional()
    .describe("Selection type for grid questions"),
  shuffle_questions: z.boolean().optional().describe("Whether to shuffle questions in the group"),
});

/**
 * Schema for create item request in batch operations
 */
export const CreateItemRequestSchema = z
  .object({
    title: z.string().describe("Item title"),
    description: z.string().optional().describe("Item description"),
    index: z.number().optional().describe("Insertion position (appends to the end if omitted)"),
    item_type: ItemTypeSchema.describe("Type of item to create"),
    question_type: QuestionTypeSchema.optional().describe(
      "Type of question (required when creating question items)",
    ),
    options: z
      .array(FormOptionSchema)
      .optional()
      .describe("List of options with optional branching logic"),
    required: z.boolean().optional().describe("Whether the question is required"),
    include_other: z.boolean().optional().describe("Whether to include an 'Other' option"),
    question_group_params: QuestionGroupParamsSchema.optional().describe(
      "Parameters specific to question group items",
    ),
  })
  .describe("Request object for creating an item");

/**
 * Schema for update item request in batch operations
 */
export const UpdateItemRequestSchema = z
  .object({
    item: z.any().describe("Full item object after update"),
    index: z.number().describe("Index of the item to update"),
    update_mask: z
      .string()
      .describe(
        `A comma-separated list of fully qualified names of fields. Example: "user.displayName,photo"`,
      ),
  })
  .describe("Request object for updating an item");

/**
 * Schema for delete item request in batch operations
 */
export const DeleteItemRequestSchema = z
  .object({
    index: z.number().describe("Index of the item to delete"),
  })
  .describe("Request object for deleting an item");

/**
 * Schema for move item request in batch operations
 */
export const MoveItemRequestSchema = z
  .object({
    index: z.number().describe("Original index of the item to move"),
    new_index: z.number().describe("Destination index for the item"),
  })
  .describe("Request object for moving an item");

/**
 * Schema for update form info request in batch operations
 */
export const UpdateFormInfoRequestSchema = z
  .object({
    title: z.string().optional().describe("New form title"),
    description: z.string().optional().describe("New form description"),
  })
  .describe("Request object for updating form information");

/**
 * Schema for update form settings request in batch operations
 */
export const UpdateFormSettingsRequestSchema = z
  .object({
    email_collection_type: z
      .enum(["DO_NOT_COLLECT", "VERIFIED", "RESPONDER_INPUT"])
      .optional()
      .describe(
        "Email collection type (DO_NOT_COLLECT: do not collect, VERIFIED: verified email, RESPONDER_INPUT: email input by respondent). Setting this to RESPONDER_INPUT automatically add a question to the form asking for the email address. Make sure not to have two email address questions in the form.",
      ),
    is_quiz: z.boolean().optional().describe("Whether it's in quiz format"),
    release_grade: z
      .enum(["NONE", "IMMEDIATELY", "LATER"])
      .optional()
      .describe("Grade release method"),
  })
  .describe("Request object for updating form settings");

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
  updateFormSettingsRequest: UpdateFormSettingsRequestSchema.optional(),
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
