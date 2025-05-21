import type { ItemType, QuestionType } from "./index.js";

// Parameter type definitions for Google Forms requests

export type CreateItemRequestParams = {
  title: string;
  description?: string;
  index?: number;
  itemType: ItemType;
  questionType?: QuestionType;
  options?: string[];
  required?: boolean;
  includeOther?: boolean;
  // For question_group only
  rows?: { title: string; required?: boolean }[];
  isGrid?: boolean;
  columns?: string[];
  gridType?: "CHECKBOX" | "RADIO";
  shuffleQuestions?: boolean;
};

export type UpdateItemRequestParams = {
  index: number;
  title?: string;
  description?: string;
  required?: boolean;
};

export type DeleteItemRequestParams = {
  index: number;
};

export type MoveItemRequestParams = {
  index: number;
  newIndex: number;
};

export type UpdateFormInfoRequestParams = {
  title?: string;
  description?: string;
};
