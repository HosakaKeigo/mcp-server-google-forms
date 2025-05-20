// Google Formsリクエスト用パラメータ型定義

export type CreateItemRequestParams = {
  title: string;
  description?: string;
  index?: number;
  itemType: "text" | "question" | "pageBreak" | "questionGroup";
  questionType?: "TEXT" | "PARAGRAPH_TEXT" | "RADIO" | "CHECKBOX" | "DROP_DOWN";
  options?: string[];
  required?: boolean;
  includeOther?: boolean;
  // question_group専用
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
