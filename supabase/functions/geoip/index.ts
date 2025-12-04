import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  try {
    // Get client IP from request headers
    let clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "";
    // Handle comma-separated IPs (x-forwarded-for can contain multiple IPs)
    if (clientIP.includes(",")) {
      clientIP = clientIP.split(",")[0].trim();
    }
    console.log(`[GeoIP] Processing request for IP: ${clientIP}`);
    // For development/testing, use a default country if no IP or localhost
    if (!clientIP || clientIP === "127.0.0.1" || clientIP.startsWith("192.168.") || clientIP.startsWith("10.")) {
      console.log("[GeoIP] Using fallback for localhost/private IP");
      return new Response(JSON.stringify({
        success: true,
        country: "Tunisia",
        country_code: "TN",
        ip: clientIP || "localhost"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Try multiple GeoIP services in order of preference
    const geoipServices = [
      {
        name: "ipapi.co",
        url: `https://ipapi.co/${clientIP}/json/`,
        parseResponse: (data)=>({
            country: data.country_name || "Unknown",
            country_code: data.country_code || data.country || "XX"
          })
      },
      {
        name: "ip-api.com",
        url: `http://ip-api.com/json/${clientIP}?fields=status,country,countryCode`,
        parseResponse: (data)=>({
            country: data.country || "Unknown",
            country_code: data.countryCode || "XX"
          })
      },
      {
        name: "ipinfo.io",
        url: `https://ipinfo.io/${clientIP}/json`,
        parseResponse: (data)=>({
            country: data.country_name || "Unknown",
            country_code: data.country || "XX"
          })
      }
    ];
    let lastError = null;
    // Try each service until one works
    for (const service of geoipServices){
      try {
        console.log(`[GeoIP] Trying ${service.name} for IP: ${clientIP}`);
        const geoResponse = await fetch(service.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EsportZone/1.0)',
            'Accept': 'application/json'
          }
        });
        if (!geoResponse.ok) {
          console.warn(`[GeoIP] ${service.name} returned status: ${geoResponse.status}`);
          lastError = `${service.name} returned status ${geoResponse.status}`;
          continue;
        }
        const geoData = await geoResponse.json();
        console.log(`[GeoIP] ${service.name} response:`, JSON.stringify(geoData));
        // Handle potential error responses
        if (geoData.error || geoData.status === 'fail') {
          console.warn(`[GeoIP] ${service.name} returned error:`, geoData.error || geoData.message);
          lastError = geoData.error || geoData.message || `${service.name} returned error`;
          continue;
        }
        // Parse the response using the service-specific parser
        const parsedData = service.parseResponse(geoData);
        // Validate that we got useful data
        if (!parsedData.country_code || parsedData.country_code === "XX") {
          console.warn(`[GeoIP] ${service.name} returned invalid country code`);
          lastError = `${service.name} returned invalid country code`;
          continue;
        }
        console.log(`[GeoIP] Successfully got location from ${service.name}:`, parsedData);
        const response = {
          success: true,
          country: parsedData.country,
          country_code: parsedData.country_code,
          ip: clientIP
        };
        return new Response(JSON.stringify(response), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      } catch (error) {
        console.warn(`[GeoIP] Error with ${service.name}:`, error.message);
        lastError = `${service.name}: ${error.message}`;
        continue;
      }
    }
    // If all services failed, return fallback
    console.warn(`[GeoIP] All services failed, using fallback. Last error: ${lastError}`);
    return new Response(JSON.stringify({
      success: true,
      country: "Tunisia",
      country_code: "TN",
      ip: clientIP,
      fallback: true,
      last_error: lastError
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("[GeoIP] Unexpected error:", error);
    // Return a fallback response with error info
    const errorResponse = {
      success: false,
      error: error.message || "Unknown error occurred",
      country: "Tunisia",
      country_code: "TN"
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
