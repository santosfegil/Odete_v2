import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenAI } from 'https://esm.sh/@google/genai'

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Create Supabase Client
    // These env vars are automatically available in Supabase Edge Functions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 3. Verify User (Optional but recommended)
    /* 
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
         // For now, allowing anonymous for demo purposes if Auth isn't fully set up in front
         // throw new Error('Unauthorized') 
    }
    */

    // 4. Parse Request
    const { message, history, mode } = await req.json()

    // 5. Fetch Prompt from DB
    const { data: promptData } = await supabaseClient
      .from('ai_prompts')
      .select('system_instruction')
      .eq('slug', mode === 'julgar' ? 'odete_julgar' : 'odete_mimar')
      .eq('is_active', true)
      .single()

    const systemInstruction = promptData?.system_instruction || 
      "Você é a Odete. (Prompt de fallback do servidor caso o banco falhe)"

    // 6. Call Gemini API (Securely on server)
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("Server missing GEMINI_API_KEY");

    const ai = new GoogleGenAI({ apiKey })
    const model = 'gemini-2.5-flash'
    
    // Create Chat
    // Note: We are simplifying tools/history here for the proxy demo. 
    // Ideally, tools definitions should also be shared or defined here.
    const chat = ai.chats.create({
      model: model,
      history: history,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    })

    // Note: Simple text message for now. 
    // Audio/Multimodal handling requires parsing formData or base64 in the body deeper.
    const result = await chat.sendMessage({ message: message })

    // 7. Return Response
    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})