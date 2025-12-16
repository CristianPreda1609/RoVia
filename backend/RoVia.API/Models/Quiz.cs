namespace RoVia.API.Models;

public class Quiz
{
    public int Id { get; set; }
    public int AttractionId { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public int DifficultyLevel { get; set; } // 1-Easy, 2-Medium, 3-Hard
    public int TimeLimit { get; set; } // in seconds
    public DateTime CreatedAt { get; set; }
    public int? CreatedByUserId { get; set; }
    public bool IsApproved { get; set; } = true;
    
    // Navigation
    public Attraction Attraction { get; set; }
    public User CreatedByUser { get; set; }
    public ICollection<Question> Questions { get; set; } = new List<Question>();
}

public class Question
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public string Text { get; set; }
    public int PointsValue { get; set; }
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation
    public Quiz Quiz { get; set; }
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();
}

public class Answer
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string Text { get; set; }
    public bool IsCorrect { get; set; }
    public int Order { get; set; }
    
    // Navigation
    public Question Question { get; set; }
}
