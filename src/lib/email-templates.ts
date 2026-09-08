import { DecisionChoice } from "./decisions";

interface TemplateArgs {
  name: string;
}

export function getEmailTemplate(
  choice: DecisionChoice,
  { name }: TemplateArgs
): { subject: string; body: string } {
  const firstName = name.split(" ")[0];

  switch (choice) {
    case "continue_getting_to_know":
    case "another_conversation":
      return {
        subject: "Let's keep talking",
        body: `Hi ${firstName},

Thank you for being so open in what you shared — I really enjoyed getting to know you a little better through it.

I'd like to keep talking and see where this goes. I'll be in touch soon.

Warmly`,
      };

    case "take_it_slowly":
      return {
        subject: "Taking things slowly",
        body: `Hi ${firstName},

Thank you for your honesty — it meant a lot. I'm not in a rush on this, and I don't think you should be either. Let's just take things slowly and see how it feels.

Talk soon`,
      };

    case "better_as_friends":
      return {
        subject: "Thank you for your honesty",
        body: `Hi ${firstName},

I really appreciated how openly you answered everything. Having sat with it, I don't think we're the right fit romantically — but I'd genuinely value staying in touch as friends, if that's something you'd want too.

Thank you again for taking this seriously`,
      };

    case "not_compatible":
      return {
        subject: "Thank you for your honesty",
        body: `Hi ${firstName},

Thank you for taking the time to answer everything so thoughtfully — I know that wasn't nothing, and I don't take it lightly.

Having sat with it, I don't think we're the right match for each other right now. I wish you well, genuinely.`,
      };
  }
}
