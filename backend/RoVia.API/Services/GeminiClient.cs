using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace RoVia.API.Services;

public class GeminiClient
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;
    private readonly string _model;
    private readonly ILogger<GeminiClient> _logger;

    public GeminiClient(HttpClient httpClient, IConfiguration configuration, ILogger<GeminiClient> logger)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Gemini:ApiKey"];
        _model = configuration["Gemini:Model"] ?? "gemini-2.0-flash";
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

    public async Task<string?> GenerateChallengesJsonAsync(string prompt, CancellationToken cancellationToken)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("Gemini API key is not configured. Using fallback challenges.");
            return null;
        }

        try
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

            var payload = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                },
                generationConfig = new
                {
                    temperature = 0.4,
                    maxOutputTokens = 800
                }
            };

            var json = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            _logger.LogInformation("Calling Gemini API with model: {Model}", _model);
            using var response = await _httpClient.PostAsync(url, content, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Gemini API returned {StatusCode}: {Error}", response.StatusCode, errorBody);
                return null;
            }

            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogInformation("Gemini API response received successfully");
            
            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
            {
                _logger.LogWarning("Gemini response has no candidates");
                return null;
            }

            var text = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();
            _logger.LogInformation("Gemini generated FULL text: {Text}", text);
            return text;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception calling Gemini API");
            return null;
        }
    }
}
