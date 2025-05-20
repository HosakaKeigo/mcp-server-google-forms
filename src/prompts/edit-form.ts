//import { z } from "zod";
//import { FormUrlSchema } from "../types/index.js";

///**
// * フォーム編集プロンプトの引数定義
// */
//export const EditFormPromptArgs = {
//  form_url: FormUrlSchema.describe("Google FormsのURL"),
//};

///**
// * フォーム編集プロンプトのテンプレート生成
// * @param args プロンプトの引数
// * @returns プロンプトテンプレート
// */
//export function generateEditFormPrompt(args: { form_url: string }) {
//  return {
//    description: "Google Formsを編集するためのガイド",
//    messages: [
//      {
//        role: "user",
//        content: {
//          type: "text",
//          text: `Google Forms「${args.form_url}」の編集をサポートしてください。

//まず、get_formツールを使用してフォームの現在の構造を取得してください。
//そして、必要に応じてupdate_formツールを使用してフォームを更新します。

//フォーム更新では以下の形式のJSONを使用します：

//\`\`\`json
//{
//  "requests": [
//    {
//      "updateFormInfo": {
//        "info": {
//          "title": "新しいタイトル",
//          "description": "新しい説明"
//        },
//        "updateMask": "title,description"
//      }
//    }
//  ],
//  "includeFormInResponse": true
//}
//\`\`\`

//質問項目を追加するには：

//\`\`\`json
//{
//  "requests": [
//    {
//      "createItem": {
//        "item": {
//          "title": "質問タイトル",
//          "questionItem": {
//            "question": {
//              "required": true,
//              "choiceQuestion": {
//                "type": "RADIO",
//                "options": [
//                  { "value": "選択肢1" },
//                  { "value": "選択肢2" }
//                ]
//              }
//            }
//          }
//        },
//        "location": { "index": 0 }
//      }
//    }
//  ]
//}
//\`\`\`

//どのような編集をしたいですか？`,
//        },
//      },
//    ],
//  };
//}
