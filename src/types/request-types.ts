import type { forms_v1 } from "@googleapis/forms";
import type { ItemType, QuestionType } from "./index.js";

// GoToAction enum for branching in forms
export type GoToAction = "NEXT_SECTION" | "RESTART_FORM" | "SUBMIT_FORM";

// Option with unified format
export type FormOption = {
  value: string;
  goToAction?: GoToAction;
  goToSectionId?: string;
};

// Parameter type definitions for Google Forms requests

export type CreateItemRequestParams = {
  title: string;
  description?: string;
  index?: number;
  itemType: ItemType;
  questionType?: QuestionType;
  options?: FormOption[];
  required?: boolean;
  includeOther?: boolean;
  // For question_group only
  rows?: { title: string; required?: boolean }[];
  isGrid?: boolean;
  columns?: FormOption[];
  gridType?: "CHECKBOX" | "RADIO";
  shuffleQuestions?: boolean;
};

export type UpdateItemRequestParams = {
  item: forms_v1.Schema$Item;
  location: forms_v1.Schema$Location;
  updateMask: string;
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
