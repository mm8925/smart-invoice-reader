import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceData, ExpenseCategory } from "../types";

// Helper to convert file to base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractInvoiceData = async (file: File): Promise<InvoiceData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash"; // Good balance of speed and multimodal capability

  const filePart = await fileToGenerativePart(file);

  const prompt = `
    Analyze this invoice or receipt image/PDF. Extract the following structured data:
    1. Vendor/Merchant Name
    2. Invoice Number (if available, else empty)
    3. Date (Format YYYY-MM-DD)
    4. Currency (e.g., USD, EUR)
    5. Subtotal, Tax, and Total Amount
    6. Payment Method (e.g., "Credit Card", "Cash", "Visa *1234")
    7. Line Items (description, quantity, unit price, total)
    8. Categorize the expense into one of these: ${Object.values(ExpenseCategory).join(", ")}.
    9. Assess confidence level (High, Medium, Low) based on image clarity and data completeness.
    10. Add AI notes explaining any low confidence fields or if the document is damaged/blurry.

    Return the result strictly as JSON.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: {
        role: "user",
        parts: [
            filePart,
            { text: prompt }
        ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vendorName: { type: Type.STRING },
          invoiceNumber: { type: Type.STRING },
          date: { type: Type.STRING },
          currency: { type: Type.STRING },
          subtotal: { type: Type.NUMBER },
          tax: { type: Type.NUMBER },
          totalAmount: { type: Type.NUMBER },
          paymentMethod: { type: Type.STRING },
          category: { type: Type.STRING, enum: Object.values(ExpenseCategory) },
          lineItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unitPrice: { type: Type.NUMBER },
                total: { type: Type.NUMBER },
              },
            },
          },
          confidenceLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          aiNotes: { type: Type.STRING },
        },
        required: ["vendorName", "date", "totalAmount", "category", "lineItems"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No data returned from AI");

  try {
    const data = JSON.parse(text) as InvoiceData;
    return data;
  } catch (e) {
    console.error("JSON Parse Error", e);
    throw new Error("Failed to parse AI response");
  }
};
