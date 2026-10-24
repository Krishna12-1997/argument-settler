import fs from "fs";
import path from "path";

export class PromptLoader {
  private static promptDir = path.resolve(process.cwd(), "prompts");

  public static load(
    filename: string,
    variables: Record<string, string> = {},
  ): string {
    const filePath = path.join(this.promptDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Prompt file not found: ${filePath}`);
    }

    let template = fs.readFileSync(filePath, "utf-8");

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, "g");
      const escapedValue = value.replace(/[&<>]/g, (character) => {
        switch (character) {
          case "&":
            return "&amp;";
          case "<":
            return "&lt;";
          default:
            return "&gt;";
        }
      });
      template = template.replace(placeholder, () => escapedValue);
    }

    return template;
  }
}
