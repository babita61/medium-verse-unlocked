
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.41.0";

interface RequestBody {
  email: string;
  userId: string | null;
  categoryIds: string[];
}

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged-in user
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the request body
    const requestData = await req.json() as RequestBody;
    const { email, userId, categoryIds } = requestData;

    // Check if email already exists in subscriptions
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let subscriptionId;
    let isUpdated = false;

    if (existingSubscription?.id) {
      // Update existing subscription
      subscriptionId = existingSubscription.id;
      isUpdated = true;

      // Delete existing category selections
      await supabase
        .from("subscription_categories")
        .delete()
        .eq("subscription_id", subscriptionId);
    } else {
      // Create new subscription
      const { data: newSubscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          email,
          user_id: userId,
          created_at: new Date().toISOString()
        })
        .select("id")
        .single();

      if (subscriptionError) {
        throw subscriptionError;
      }
      
      subscriptionId = newSubscription.id;
    }

    // Add category selections
    const categoryData = categoryIds.map(categoryId => ({
      subscription_id: subscriptionId,
      category_id: categoryId
    }));

    await supabase
      .from("subscription_categories")
      .insert(categoryData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: isUpdated,
        subscriptionId 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
