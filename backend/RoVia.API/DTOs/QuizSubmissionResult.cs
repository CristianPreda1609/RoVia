namespace RoVia.API.DTOs;

public class QuizSubmissionResult
{
    public int PointsEarned { get; set; }
    public int BasePoints { get; set; }
    public int DifficultyMultiplier { get; set; }
    public int MaxPoints { get; set; }
    public int CorrectAnswers { get; set; }
    public int TotalQuestions { get; set; }
    public int QuestionPoolSize { get; set; }
    public double Accuracy => TotalQuestions == 0 ? 0 : Math.Round((double)CorrectAnswers / TotalQuestions, 4);
}
