
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GEMINI_API_KEY = "AIzaSyBtwam1oTcFUgh8QzGHadeWwnSawXaPe0o";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIRequest {
  action: "summarize" | "related" | "analyze";
  content: string;
  additionalData?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, content, additionalData } = await req.json() as AIRequest;
    
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    // Different prompts based on the action
    let prompt = "";
    
    if (action === "summarize") {
      prompt = `Summarize the following blog post in 3-4 concise bullet points, highlighting the key takeaways. Keep it under 200 words total:
      
      ${content}`;
    } 
    else if (action === "related") {
      const { allPostTitles, allPostContents, allPostSlugs } = additionalData;
      
      prompt = `Given the following blog post content: 
      
      ${content.substring(0, 2000)}
      
      Identify the 3 most related posts from this list based on semantic similarity, shared themes, similar topics, and complementary subject matter:
      
      ${allPostTitles.map((title: string, i: number) => `${i+1}. ${title}: ${allPostContents[i].substring(0, 300)}...`).join('\n\n')}

      Return ONLY a JSON array with the indexes (0-based) of the 3 most related posts, like [0, 3, 5]. Do not include any explanations or other text.`;
    }

    console.log(`Sending request to Gemini AI for action: ${action}`);
    
    // Updated to use the Gemini generative API correctly
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    let result;

    if (action === "summarize") {
      result = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      // Check if we got a valid result
      if (!result) {
        console.error("Invalid Gemini API response structure:", data);
        throw new Error("Failed to extract summary from Gemini response");
      }
      
      console.log("Generated summary:", result.substring(0, 100) + "...");
    } 
    else if (action === "related") {
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("Raw related posts response:", rawText);
      
      try {
        // Try to extract the JSON array from the text
        const matches = rawText.match(/\[[\d,\s]+\]/);
        if (matches) {
          result = JSON.parse(matches[0]);
        } else {
          // Fallback if we can't extract valid JSON
          result = [];
        }
      } catch (e) {
        console.error("Error parsing related posts JSON:", e);
        result = [];
      }
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in AI helper function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
