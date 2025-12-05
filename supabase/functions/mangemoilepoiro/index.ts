import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { method } = req;
    const url = new URL(req.url);

    // GET - Retrieve all records or a specific one by ID
    if (method === 'GET') {
      const id = url.searchParams.get('id');
      
      if (id) {
        const { data, error } = await supabase
          .from('bigfloetoli')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const { data, error } = await supabase
          .from('bigfloetoli')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // POST - Create a new record
    if (method === 'POST') {
      const body = await req.json();
      const { bigflo, oli } = body;

      const { data, error } = await supabase
        .from('bigfloetoli')
        .insert({ bigflo, oli })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
      );
    }

    // PUT - Update an existing record
    if (method === 'PUT') {
      const body = await req.json();
      const { id, bigflo, oli } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'ID is required for update' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('bigfloetoli')
        .update({ bigflo, oli })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Delete a record
    if (method === 'DELETE') {
      const body = await req.json();
      const { id } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'ID is required for deletion' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const { error } = await supabase
        .from('bigfloetoli')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Record deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});