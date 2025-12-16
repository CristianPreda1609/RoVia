using RoVia.API.Data;
using RoVia.API.DTOs;
using RoVia.API.Models;
using Microsoft.EntityFrameworkCore;

namespace RoVia.API.Services;

public class QuizService
{
    private readonly AppDbContext _context;

    public QuizService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Quiz>> GetQuizzesByAttractionAsync(int attractionId)
    {
        return await _context.Quizzes
            .Where(q => q.AttractionId == attractionId)
            .Include(q => q.Questions)
            .ThenInclude(q => q.Answers)
            .ToListAsync();
    }

    public async Task<Quiz> GetQuizWithQuestionsAsync(int quizId)
    {
        return await _context.Quizzes
            .Where(q => q.Id == quizId)
            .Include(q => q.Questions)
            .ThenInclude(q => q.Answers)
            .FirstOrDefaultAsync();
    }

    public async Task<QuizSubmissionResult?> SubmitQuizAsync(int userId, int quizId, Dictionary<int, int> answers)
    {
        var quiz = await GetQuizWithQuestionsAsync(quizId);
        if (quiz == null) return null;
        if (answers == null || answers.Count == 0) return null;

        var questions = quiz.Questions ?? new List<Question>();
        var questionPoolSize = questions.Count;
        var answeredQuestions = questions
            .Where(q => answers.ContainsKey(q.Id))
            .ToList();

        if (!answeredQuestions.Any()) return null;

        int correctCount = 0;
        int earnedBasePoints = 0;
        int potentialBasePoints = answeredQuestions.Sum(q => q.PointsValue);

        foreach (var question in answeredQuestions)
        {
            if (answers.TryGetValue(question.Id, out int selectedAnswerId))
            {
                var selectedAnswer = question.Answers.FirstOrDefault(a => a.Id == selectedAnswerId);
                if (selectedAnswer?.IsCorrect == true)
                {
                    correctCount++;
                    earnedBasePoints += question.PointsValue;
                }
            }
        }

        // Calcul final cu bonus pentru dificultate
        int multiplier = Math.Max(1, quiz.DifficultyLevel);
        int finalPoints = earnedBasePoints * multiplier;
        int maxPoints = potentialBasePoints * multiplier;

        // Salvare progres
        var userProgress = new UserProgress
        {
            UserId = userId,
            QuizId = quizId,
            PointsEarned = finalPoints,
            CorrectAnswers = correctCount,
            TotalQuestions = answeredQuestions.Count,
            IsCompleted = true,
            CompletedAt = DateTime.UtcNow,
            TimeSpentSeconds = 0
        };

        _context.UserProgresses.Add(userProgress);

        // Update total points ale utilizatorului
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.TotalPoints += finalPoints;
            _context.Users.Update(user);
        }

        await _context.SaveChangesAsync();

        return new QuizSubmissionResult
        {
            PointsEarned = finalPoints,
            BasePoints = earnedBasePoints,
            DifficultyMultiplier = multiplier,
            MaxPoints = maxPoints,
            CorrectAnswers = correctCount,
            TotalQuestions = answeredQuestions.Count,
            QuestionPoolSize = questionPoolSize
        };
    }
}
