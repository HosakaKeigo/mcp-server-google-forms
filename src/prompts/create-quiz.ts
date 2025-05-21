import { z } from "zod";
import type { IMCPPrompt, InferZodParams } from "../types/index.js";

/**
 * Data analysis prompt class
 */
export class CreateQuizPrompt implements IMCPPrompt {
  readonly name = "create-quiz";

  /**
   * Prompt schema
   */
  readonly schema = {
    quizTitle: z.string().describe("Title of the quiz"),
    questions: z.array(
      z.object({
        question: z.string().describe("Question text"),
        options: z.array(z.string()).describe("Answer options"),
        correctAnswer: z.string().describe("Correct answer"),
      })
    ).describe("List of questions in the quiz"),
  } as const;

  /**
   * Prompt handler
   */
  handler(args: InferZodParams<typeof this.schema>) {
    return {
      messages: [
        {
          role: "assistant" as const,
          content: {
            type: "text" as const,
            text: "I am a quiz generator. Create a quiz based on the provided title and questions. First update Google Forms to quiz mode with single update request, then create the quiz with the provided questions.",
          }
        },
      ],
    };
  }
}
