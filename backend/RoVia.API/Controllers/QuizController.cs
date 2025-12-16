using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RoVia.API.Services;
using System;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using RoVia.API.DTOs;
using RoVia.API.Models;

namespace RoVia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuizController : ControllerBase
{
    private const int QuestionsPerAttempt = 3;
    private readonly QuizService _quizService;
    private readonly ProfileService _profileService;

    public QuizController(QuizService quizService, ProfileService profileService)
    {
        _quizService = quizService;
        _profileService = profileService;
    }

    // GET: lista quiz-uri pentru o atracție
    [AllowAnonymous]
    [HttpGet("attraction/{attractionId}")]
    public async Task<IActionResult> GetQuizzesByAttraction(int attractionId)
    {
        var quizzes = await _quizService.GetQuizzesByAttractionAsync(attractionId);
        var result = quizzes.Select(q =>
        {
            var poolSize = q.Questions?.Count ?? 0;
            var attemptSize = poolSize == 0 ? 0 : Math.Min(QuestionsPerAttempt, poolSize);
            var basePoints = q.Questions?
                .OrderByDescending(question => question.PointsValue)
                .Take(attemptSize)
                .Sum(question => question.PointsValue) ?? 0;

            return new
            {
                q.Id,
                q.Title,
                q.Description,
                q.DifficultyLevel,
                q.TimeLimit,
                QuestionsCount = attemptSize,
                QuestionPoolSize = poolSize,
                MaxPoints = basePoints * Math.Max(1, q.DifficultyLevel)
            };
        });
        return Ok(result);
    }

    // GET: detalii quiz cu întrebări și răspunsuri
    [AllowAnonymous]
    [HttpGet("{quizId}")]
    public async Task<IActionResult> GetQuiz(int quizId)
    {
        var quiz = await _quizService.GetQuizWithQuestionsAsync(quizId);
        if (quiz == null) return NotFound();

        var poolSize = quiz.Questions?.Count ?? 0;
        var attemptSize = poolSize == 0 ? 0 : Math.Min(QuestionsPerAttempt, poolSize);
        var selectedQuestions = (quiz.Questions ?? new List<Question>())
            .OrderBy(_ => Guid.NewGuid())
            .Take(attemptSize)
            .ToList();

        var basePoints = selectedQuestions.Sum(q => q.PointsValue);
        var maxPoints = basePoints * Math.Max(1, quiz.DifficultyLevel);

        return Ok(new
        {
            quiz.Id,
            quiz.Title,
            quiz.Description,
            quiz.DifficultyLevel,
            quiz.TimeLimit,
            QuestionPoolSize = poolSize,
            AttemptQuestions = selectedQuestions.Count,
            MaxPoints = maxPoints,
            Questions = selectedQuestions.Select(q => new
            {
                q.Id,
                q.Text,
                q.PointsValue,
                QuestionType = ResolveQuestionType(q),
                Answers = q.Answers.Select(a => new
                {
                    a.Id,
                    a.Text,
                    a.Order
                }).OrderBy(a => a.Order)
            })
        });
    }

    // POST: submit quiz răspunsuri (protejat)
    [Authorize]
    [HttpPost("{quizId}/submit")]
    public async Task<IActionResult> SubmitQuiz(int quizId, [FromBody] Dictionary<int, int> answers)
    {
        // Citire user id din token - încercămClaimTypes.NameIdentifier sau sub
        int userId = 0;
        var nameId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(nameId) && int.TryParse(nameId, out var nid)) userId = nid;
        else
        {
            var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (!string.IsNullOrEmpty(sub) && int.TryParse(sub, out var sid)) userId = sid;
        }

        if (userId == 0) return Unauthorized();

        var submissionResult = await _quizService.SubmitQuizAsync(userId, quizId, answers);
        if (submissionResult == null) return NotFound();
        await _profileService.CheckAndUnlockBadgesAsync(userId);

        return Ok(submissionResult);
    }

    private static string ResolveQuestionType(Question question)
    {
        if (question?.Answers == null || !question.Answers.Any())
            return "multiple_choice";

        var normalized = question.Answers
            .Select(a => NormalizeAnswerText(a.Text))
            .ToList();

        if (normalized.Count == 2 && normalized.Contains("adevarat") && normalized.Contains("fals"))
        {
            return "true_false";
        }

        return "multiple_choice";
    }

    private static string NormalizeAnswerText(string? text)
    {
        var value = (text ?? string.Empty).Trim().ToLowerInvariant();

        return value
            .Replace('ă', 'a')
            .Replace('â', 'a')
            .Replace('î', 'i')
            .Replace('ș', 's')
            .Replace('ş', 's')
            .Replace('ț', 't')
            .Replace('ţ', 't');
    }
}
