export type LegalSection = { heading: string; paragraphs?: string[]; bullets?: string[] };
export type LegalDoc = { slug: "privacy" | "terms" | "disclaimer"; title: string; description: string; intro: string; sections: LegalSection[] };

export const LEGAL_UPDATED = "24 October 2026";

export const privacy: LegalDoc = {
  slug: "privacy",
  title: "Privacy Policy",
  description: "How James Kale & Co. Advocates collects, uses and protects personal data, in line with the Kenya Data Protection Act, 2019.",
  intro:
    "This policy explains how James Kale & Co. Advocates (“we”, “us”) handles personal data collected through this website, in line with the Data Protection Act, 2019 of Kenya.",
  sections: [
    {
      heading: "1. Who is responsible for your data",
      paragraphs: ["James Kale & Co. Advocates is the data controller for personal data collected through this website. Our contact details are on the Contact page and in the footer of every page."],
    },
    {
      heading: "2. What we collect",
      bullets: [
        "Details you give us in the consultation booking and contact forms: your name, phone number, email address, preferred appointment date and time, practice area and the description of your matter.",
        "Technical data such as IP address, browser type and pages visited, collected by our hosting provider and, only if you consent, by analytics tools.",
        "Records of WhatsApp or phone contact when you choose to reach us that way.",
      ],
    },
    {
      heading: "3. Why we use it and our legal basis",
      bullets: [
        "To respond to your enquiry and arrange a consultation (your consent, and steps taken at your request).",
        "To run, secure and improve the website (our legitimate interests).",
        "To meet legal, regulatory and professional obligations.",
      ],
    },
    {
      heading: "4. Please keep forms brief",
      paragraphs: [
        "Do not put highly sensitive information or confidential documents in website forms. Tell us only enough to arrange a consultation. We will agree a secure way to share documents once we are in contact.",
      ],
    },
    {
      heading: "5. Who we share it with",
      paragraphs: ["We do not sell personal data. We use trusted service providers to operate the site, who process data on our instructions:"],
      bullets: [
        "Supabase, which stores form submissions and site content.",
        "Vercel, which hosts the website.",
        "Resend, which delivers our email notifications.",
      ],
    },
    {
      heading: "6. Transfers outside Kenya",
      paragraphs: [
        "Some of these providers store or process data outside Kenya. Where this happens we take steps to make sure your data is protected as the Data Protection Act requires.",
      ],
    },
    {
      heading: "7. How long we keep it",
      paragraphs: [
        "We keep enquiry data only as long as needed to handle your enquiry and to meet legal and professional obligations. After that it is deleted or anonymised.",
      ],
    },
    {
      heading: "8. Your rights",
      paragraphs: ["Under the Data Protection Act, 2019 you have the right to:"],
      bullets: [
        "be informed about how your data is used;",
        "access the personal data we hold about you;",
        "object to the processing of your data;",
        "ask us to correct inaccurate data;",
        "ask us to delete data we no longer need;",
        "receive your data in a portable format where applicable.",
      ],
    },
    {
      heading: "9. Complaints",
      paragraphs: [
        "To exercise your rights, contact us using the details on our Contact page. If you are not satisfied with our response, you may complain to the Office of the Data Protection Commissioner of Kenya.",
      ],
    },
    {
      heading: "10. Cookies",
      paragraphs: [
        "We use strictly necessary cookies to keep the site and the staff login working. Optional analytics cookies are used only if you accept them in the cookie banner, and you can change your choice at any time.",
      ],
    },
    {
      heading: "11. Security",
      paragraphs: [
        "We protect data with encryption in transit, access controls and database-level security. No online system is completely secure, so please share only what is necessary.",
      ],
    },
    {
      heading: "12. Children",
      paragraphs: ["This website is not directed at children and we do not knowingly collect their data without a parent or guardian’s involvement."],
    },
    {
      heading: "13. Changes to this policy",
      paragraphs: ["We may update this policy from time to time. The date at the top shows when it was last changed."],
    },
  ],
};

export const terms: LegalDoc = {
  slug: "terms",
  title: "Terms of Use",
  description: "The terms that apply when you use the James Kale & Co. Advocates website.",
  intro: "By using this website you agree to these terms. If you do not agree, please do not use the site.",
  sections: [
    {
      heading: "1. Information only",
      paragraphs: [
        "Content on this website is general information about legal topics in Kenya. It is not legal advice and should not be relied on as such. Laws change, and every situation is different.",
      ],
    },
    {
      heading: "2. No advocate-client relationship",
      paragraphs: [
        "Using this website, sending a form, calling or messaging us does not create an advocate-client relationship. That relationship begins only when we have agreed in writing to act for you.",
      ],
    },
    {
      heading: "3. Accuracy",
      paragraphs: ["We take care to keep the site accurate and current but give no guarantee that it is complete or up to date."],
    },
    {
      heading: "4. Intellectual property",
      paragraphs: [
        "The text, design and logos on this website belong to James Kale & Co. Advocates unless stated otherwise. You may view and print pages for personal use. You may not copy or republish them commercially without our written permission.",
      ],
    },
    {
      heading: "5. Acceptable use",
      paragraphs: ["You agree not to misuse the website, attempt to gain unauthorised access, submit false or abusive content, or interfere with its operation."],
    },
    {
      heading: "6. Links to other sites",
      paragraphs: ["We may link to third-party sites for convenience. We do not control them and are not responsible for their content."],
    },
    {
      heading: "7. Limitation of liability",
      paragraphs: [
        "To the fullest extent permitted by law, we are not liable for loss arising from your use of, or reliance on, this website. Nothing in these terms limits liability that cannot lawfully be limited.",
      ],
    },
    {
      heading: "8. Governing law",
      paragraphs: ["These terms are governed by the laws of Kenya, and the courts of Kenya have jurisdiction over any dispute."],
    },
    {
      heading: "9. Changes",
      paragraphs: ["We may update these terms from time to time. Continued use of the site means you accept the updated terms."],
    },
  ],
};

export const disclaimer: LegalDoc = {
  slug: "disclaimer",
  title: "Disclaimer",
  description: "Important notice: no lawyer-client relationship is created by using this website.",
  intro: "Please read this notice carefully before relying on anything on this website.",
  sections: [
    {
      heading: "No lawyer-client relationship",
      paragraphs: [
        "No lawyer-client relationship is created by using this website, by submitting a form, or by contacting us by phone, email or WhatsApp. We act for you only after we have agreed to do so in writing.",
      ],
    },
    {
      heading: "Not legal advice",
      paragraphs: [
        "Articles, summaries and answers on this site are general information about Kenyan law. They are not legal advice and cannot take your particular facts into account. Please speak to an advocate before acting.",
      ],
    },
    {
      heading: "Confidentiality before engagement",
      paragraphs: [
        "Information you send before we agree to act for you may not be protected by advocate-client privilege. Please do not send sensitive or confidential details through website forms.",
      ],
    },
    {
      heading: "No guarantee of outcome",
      paragraphs: ["Any description of past work or experience does not guarantee a similar result in your matter."],
    },
    {
      heading: "Currency of the law",
      paragraphs: ["Legislation, court decisions and procedures change. Content may not reflect the latest developments."],
    },
  ],
};
