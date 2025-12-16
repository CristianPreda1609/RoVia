namespace RoVia.API.DTOs;

public class CreateQuizRequest
{
    public int AttractionId { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public int DifficultyLevel { get; set; }
    public int TimeLimit { get; set; }
    public List<CreateQuestionRequest> Questions { get; set; } = new();
}

public class CreateQuestionRequest
{
    public string Text { get; set; }
    public int PointsValue { get; set; }
    public List<CreateAnswerRequest> Answers { get; set; } = new();
}

public class CreateAnswerRequest
{
    public string Text { get; set; }
    public bool IsCorrect { get; set; }
}
