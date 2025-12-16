using System.ComponentModel.DataAnnotations;

namespace RoVia.API.DTOs;

public class QuizCreateRequest
{
    [Required]
    public int AttractionId { get; set; }

    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(800)]
    public string Description { get; set; } = string.Empty;

    [Range(1, 3)]
    public int DifficultyLevel { get; set; } = 1;

    [Range(15, 600)]
    public int TimeLimit { get; set; } = 60;

    [MinLength(1)]
    public List<QuizQuestionRequest> Questions { get; set; } = new();
}

public class QuizUpdateRequest : QuizCreateRequest { }

public class QuizQuestionRequest
{
    [Required]
    public string Text { get; set; } = string.Empty;

    [Range(1, 100)]
    public int PointsValue { get; set; } = 10;

    public int Order { get; set; }

    [MinLength(2)]
    public List<QuizAnswerRequest> Answers { get; set; } = new();
}

public class QuizAnswerRequest
{
    [Required]
    public string Text { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public int Order { get; set; }
}
