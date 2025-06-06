import { z } from "zod";

/**
 * Form URL schema definition
 */
export const FormUrlSchema = z.string().url();

/**
 * Form item type schema
 */
export const ItemTypeSchema = z
  .enum(["text", "question", "pageBreak", "questionGroup", "image", "video"])
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
      "Branching action to take when this option is selected. Either all or no options should be set with this property.",
    ),
    goToSectionId: z
      .string()
      .optional()
      .describe(
        "Section ID to navigate to when this option is selected. You can first create a section and then use the section ID here.",
      ),
  })
  .describe("Form option with optional branching capability");


/**
 * Schema for media properties (common for image and video)
 */
const MediaPropertiesSchema = z.object({
  alignment: z
    .enum(["LEFT", "CENTER", "RIGHT"])
    .optional()
    .describe("Media alignment (default: CENTER)"),
  width: z.number().optional().describe("Media width in pixels"),
});

/**
 * Schema for image properties
 */
export const ImagePropertiesSchema = z
  .object({
    image: z.object({
      sourceUri: z.string().describe("URL of the image source"),
      altText: z.string().optional().describe("Alternative text for the image for accessibility"),
      properties: MediaPropertiesSchema.optional().describe("Additional image properties")
    }),
  })
  .describe("Properties specific to image items");

/**
 * Schema for video properties
 */
export const VideoPropertiesSchema = z
  .object({
    video: z.object({
      youtubeUri: z.string().describe("YouTube URI for the video"),
      properties: MediaPropertiesSchema.optional().describe("Additional video properties"),
    }),
    caption: z.string().optional().describe("Caption text to be displayed below the video"),
  })
  .describe("Properties specific to video items");

/**
 * Extra material link schema for grading feedback
 */
const ExtraMaterialLinkSchema = z.object({
  uri: z.string().describe("URI of the link"),
  displayText: z.string().describe("Display text for the link"),
});

/**
 * Extra material video schema for grading feedback
 */
const ExtraMaterialVideoSchema = z.object({
  displayText: z.string().describe("Display text for the video"),
  youtubeUri: z.string().describe("YouTube URI for the video"),
});

/**
 * Extra material schema for grading feedback
 */
const ExtraMaterialSchema = z
  .object({
    link: ExtraMaterialLinkSchema.optional().describe("Link material"),
    video: ExtraMaterialVideoSchema.optional().describe("Video material"),
  })
  .describe("Extra material for feedback, either link or video");

/**
 * Feedback schema for grading
 */
const FeedbackSchema = z
  .object({
    text: z.string().describe("Feedback text"),
    material: z.array(ExtraMaterialSchema).optional().describe("Extra materials for feedback"),
  })
  .describe("Feedback for grading");

/**
 * Schema for a single answer value.
 */
const AnswerValueSchema = z.object({
  value: z.string().describe("Answer value"),
}).describe("Schema for a single answer value.");

/**
 * Correct answers schema for grading
 */
const CorrectAnswersSchema = z
  .object({
    answers: z
      .array(AnswerValueSchema) // Use the new schema here
      .describe("List of correct answers"),
  })
  .describe("Correct answers for grading");

/**
 * Grading schema for questions
 */
export const GradingSchema = z
  .object({
    pointValue: z.number().int().describe("Point value for the question"),
    correctAnswers: CorrectAnswersSchema.optional().describe("Correct answers for the question"),
    whenRight: FeedbackSchema.optional().describe("Feedback when the answer is correct. IMPORTANT: This feedback can only be set for multiple choice questions that have correct answers provided."),
    whenWrong: FeedbackSchema.optional().describe("Feedback when the answer is incorrect. IMPORTANT: This feedback can only be set for multiple choice questions that have correct answers provided."),
    generalFeedback: FeedbackSchema.optional().describe("General feedback for the question"),
  })
  .describe(
    "Grading for a question. If you want to set grading, you must first set isQuiz to true by sending separate batchUpdate request. You can't set isQuiz and grading in the same request. ",
  );

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
  columns: z.array(FormOptionSchema).optional().describe("Columns for grid-style question groups"),
  grid_type: z.enum(["CHECKBOX", "RADIO"]).optional().describe("Selection type for grid questions"),
  shuffle_questions: z.boolean().optional().describe("Whether to shuffle questions in the group"),
});

/**
 * Base properties common to all form items.
 */
const BaseItemSchema = z.object({
  title: z.string().describe("Item title"),
  description: z.string().optional().describe("Item description"),
  index: z.number().optional().describe("Insertion position (appends to the end if omitted)"),
});

/**
 * Properties specific to question items.
 */
const QuestionSpecificSchema = z.object({
  question_type: QuestionTypeSchema,
  options: z
    .array(FormOptionSchema)
    .optional()
    .describe("List of options with optional branching logic (relevant for RADIO, CHECKBOX, DROP_DOWN)"),
  required: z.boolean().optional().describe("Whether the question is required"),
  include_other: z.boolean().optional().describe("Whether to include an 'Other' option (relevant for certain question types)"),
  grading: GradingSchema.optional().describe("Grading for the question"),
});

/**
 * Request to create a text item.
 */
const TextItemCreateRequestSchema = BaseItemSchema.extend({
  item_type: z.literal("text"),
}).describe("Request to create a text item");

/**
 * Request to create a question item.
 */
const QuestionItemCreateRequestSchema = BaseItemSchema.extend({
  item_type: z.literal("question"),
})
  .merge(QuestionSpecificSchema)
  .describe("Request to create a question item");

/**
 * Request to create a page break item.
 */
const PageBreakItemCreateRequestSchema = BaseItemSchema.extend({
  item_type: z.literal("pageBreak"),
}).describe("Request to create a page break item");

/**
 * Request to create a question group item.
 */
const QuestionGroupItemCreateRequestSchema = BaseItemSchema.extend({
  item_type: z.literal("questionGroup"),
  question_group_params: QuestionGroupParamsSchema,
}).describe("Request to create a question group item");

/**
 * Request to create an image item.
 */
const ImageItemCreateRequestSchema = BaseItemSchema.extend({
  item_type: z.literal("image"),
  imageItem: ImagePropertiesSchema,
}).describe("Request to create an image item");

/**
 * Request to create a video item.
 */
const VideoItemCreateRequestSchema = BaseItemSchema.extend({
  item_type: z.literal("video"),
  videoItem: VideoPropertiesSchema,
}).describe("Request to create a video item");

/**
 * Schema for create item request in batch operations
 */
export const CreateItemRequestSchema = z.discriminatedUnion("item_type", [
  TextItemCreateRequestSchema,
  QuestionItemCreateRequestSchema,
  PageBreakItemCreateRequestSchema,
  QuestionGroupItemCreateRequestSchema,
  ImageItemCreateRequestSchema,
  VideoItemCreateRequestSchema,
]).describe("Request object for creating an item");

/**
 * Represents a text item.
 */
const TextItemStateSchema = BaseItemSchema.extend({
  item_type: z.literal("text"),
}).describe("Represents a text item");

/**
 * Represents a question item.
 */
const QuestionItemStateSchema = BaseItemSchema.extend({
  item_type: z.literal("question"),
})
  .merge(QuestionSpecificSchema)
  .describe("Represents a question item");

/**
 * Represents a page break item.
 */
const PageBreakItemStateSchema = BaseItemSchema.extend({
  item_type: z.literal("pageBreak"),
}).describe("Represents a page break item");

/**
 * Represents a question group item.
 */
const QuestionGroupItemStateSchema = BaseItemSchema.extend({
  item_type: z.literal("questionGroup"),
  question_group_params: QuestionGroupParamsSchema, // This makes question_group_params non-optional
}).describe("Represents a question group item");

/**
 * Represents an image item.
 */
const ImageItemStateSchema = BaseItemSchema.extend({
  item_type: z.literal("image"),
  imageItem: ImagePropertiesSchema, // This makes imageItem non-optional
}).describe("Represents an image item");

/**
 * Represents a video item.
 */
const VideoItemStateSchema = BaseItemSchema.extend({
  item_type: z.literal("video"),
  videoItem: VideoPropertiesSchema, // This makes videoItem non-optional
}).describe("Represents a video item");

/**
 * Represents any valid form item state.
 */
export const FormItemStateSchema = z.discriminatedUnion("item_type", [
  TextItemStateSchema,
  QuestionItemStateSchema,
  PageBreakItemStateSchema,
  QuestionGroupItemStateSchema,
  ImageItemStateSchema,
  VideoItemStateSchema,
]).describe("Represents any valid form item state");


/**
 * Schema for update item request in batch operations
 */
export const UpdateItemRequestSchema = z
  .object({
    item: FormItemStateSchema.describe(
      "The full desired state of the item after the update. The update_mask determines which fields are actually changed.",
    ),
    index: z.number().describe("Index of the item to update"),
    update_mask: z
      .string()
      .describe(
        `A comma-separated list of fully qualified names of fields. Example: "user.displayName,photo"`,
      ),
  })
  .describe(
    "Request object for updating an item. You can not convert to different item types. For example, a PageBreakItem cannot be changed into another Item type by an Update operation.",
  );

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
  })
  .describe("Request object for updating form settings");

/**
 * Schema for a single batch operation as a tagged union
 */
export const BatchOperationSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("create_item"),
    createItemRequest: CreateItemRequestSchema,
  }).describe("Create item operation"),
  z.object({
    operation: z.literal("update_item"),
    updateItemRequest: UpdateItemRequestSchema,
  }).describe("Update item operation"),
  z.object({
    operation: z.literal("delete_item"),
    deleteItemRequest: DeleteItemRequestSchema,
  }).describe("Delete item operation"),
  z.object({
    operation: z.literal("move_item"),
    moveItemRequest: MoveItemRequestSchema,
  }).describe("Move item operation"),
  z.object({
    operation: z.literal("update_form_info"),
    updateFormInfoRequest: UpdateFormInfoRequestSchema,
  }).describe("Update form info operation"),
  z.object({
    operation: z.literal("update_form_settings"),
    updateFormSettingsRequest: UpdateFormSettingsRequestSchema,
  }).describe("Update form settings operation"),
]);

/**
 * Schema for batch update form parameters
 */
export const BatchUpdateFormSchema = z.object({
  form_url: FormUrlSchema.describe(
    "Google Forms URL (example: https://docs.google.com/forms/d/e/FORM_ID/edit)",
  ),
  operations: z.array(BatchOperationSchema).describe("List of operations to execute"),
});
