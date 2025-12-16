using RoVia.API.Models;

namespace RoVia.API.Data;

public static partial class DataSeeder
{
    public static void SeedAttractions(AppDbContext context)
    {
        SeedRoles(context);
        SeedAdministrator(context);

        // Înlocuire: nu mai ieși imediat dacă există atracții.
        // Adaugă atracțiile doar când nu există, dar continuă să rulezi seed pentru quiz-uri și badge-uri.
        if (!context.Attractions.Any())
        {
            var attractions = new List<Attraction>
            {
                new Attraction
                {
                    Name = "Castelul Peleș",
                    Description = "Castel regal din secolul XIX, situat în Sinaia, Prahova.",
                    Latitude = 45.3599,
                    Longitude = 25.5428,
                    Type = AttractionType.Historic,
                    Region = "Prahova",
                    ImageUrl = "https://images.unsplash.com/photo-1578662996442-48f60103fc96",
                    Rating = 4.8,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsApproved = true
                },
                new Attraction
                {
                    Name = "Palatul Parlamentului",
                    Description = "Una dintre cele mai mari clădiri administrative din lume.",
                    Latitude = 44.4268,
                    Longitude = 26.0873,
                    Type = AttractionType.Cultural,
                    Region = "București",
                    ImageUrl = "https://images.unsplash.com/photo-1541963463532-d68292c34d19",
                    Rating = 4.5,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsApproved = true
                },
                new Attraction
                {
                    Name = "Cetatea Râșnov",
                    Description = "Fortificație medievală din secolul XIII.",
                    Latitude = 45.5877,
                    Longitude = 25.4608,
                    Type = AttractionType.Historic,
                    Region = "Brașov",
                    ImageUrl = "https://images.unsplash.com/photo-1565031491910-e57fac031c41",
                    Rating = 4.3,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsApproved = true
                },
                new Attraction
                {
                    Name = "Lacul Roșu",
                    Description = "Lac natural format în urma unei alunecări de teren.",
                    Latitude = 46.6895,
                    Longitude = 25.9525,
                    Type = AttractionType.Natural,
                    Region = "Harghita",
                    ImageUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
                    Rating = 4.6,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsApproved = true
                },
                new Attraction
                {
                    Name = "Mănăstirea Voroneț",
                    Description = "Mănăstire celebră pentru frescele sale exterioare.",
                    Latitude = 47.5414,
                    Longitude = 25.9167,
                    Type = AttractionType.Religious,
                    Region = "Suceava",
                    ImageUrl = "https://images.unsplash.com/photo-1574958269340-fa927503f3dd",
                    Rating = 4.7,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsApproved = true
                }
            };

            context.Attractions.AddRange(attractions);
            context.SaveChanges();
        }

        // Adaugă Quiz-uri dacă nu există
        if (!context.Quizzes.Any())
        {
            var allAttractions = context.Attractions.ToList();
            
            foreach (var attraction in allAttractions.Take(3))
            {
                var quiz = new Quiz
                {
                    AttractionId = attraction.Id,
                    Title = $"Quiz: {attraction.Name}",
                    Description = $"Testează-ți cunoștințele despre {attraction.Name}",
                    DifficultyLevel = 2,
                    TimeLimit = 300,
                    CreatedAt = DateTime.UtcNow,
                    IsApproved = true
                };

                context.Quizzes.Add(quiz);
                context.SaveChanges();

                var templates = BuildQuestionTemplates(attraction, quiz.Id);

                context.Questions.AddRange(templates.Select(t => t.Question));
                context.SaveChanges();

                var persistedQuestions = context.Questions
                    .Where(q => q.QuizId == quiz.Id)
                    .OrderBy(q => q.Order)
                    .ToList();

                for (var i = 0; i < persistedQuestions.Count; i++)
                {
                    var answers = templates[i].Answers
                        .Select((answer, idx) => new Answer
                        {
                            QuestionId = persistedQuestions[i].Id,
                            Text = answer.Text,
                            IsCorrect = answer.IsCorrect,
                            Order = idx + 1
                        });

                    context.Answers.AddRange(answers);
                }

                context.SaveChanges();
            }
        }

        // Adaugă badge-uri dacă nu există
        if (!context.Badges.Any())
        {
            context.Badges.AddRange(new List<Badge>
            {
                new Badge
                {
                    Name = "Prima Stea",
                    Description = "Completează primul quiz",
                    IconUrl = "⭐",
                    RequiredPoints = 0,
                    Criteria = "{\"quizzesCompleted\": 1}"
                },
                new Badge
                {
                    Name = "Explorator",
                    Description = "Completează 5 quiz-uri",
                    IconUrl = "🗺️",
                    RequiredPoints = 0,
                    Criteria = "{\"quizzesCompleted\": 5}"
                },
                new Badge
                {
                    Name = "Campion",
                    Description = "Acumulează 500 de puncte",
                    IconUrl = "🏆",
                    RequiredPoints = 500,
                    Criteria = "{\"totalPoints\": 500}"
                }
            });

            context.SaveChanges();
        }
    }
}

public static partial class DataSeeder
{
    private static void SeedRoles(AppDbContext context)
    {
        if (context.Roles.Any()) return;

        context.Roles.AddRange(new List<Role>
        {
            new Role { Id = 1, Name = "Visitor" },
            new Role { Id = 2, Name = "Promoter" },
            new Role { Id = 3, Name = "Administrator" }
        });

        context.SaveChanges();
    }

    private static void SeedAdministrator(AppDbContext context)
    {
        if (context.Users.Any(u => u.Email == "admin@rovia.app")) return;

        var adminRole = context.Roles.FirstOrDefault(r => r.Name == "Administrator") ?? context.Roles.First();

        var admin = new User
        {
            Username = "admin",
            Email = "admin@rovia.app",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            RoleId = adminRole.Id,
            CreatedAt = DateTime.UtcNow,
            TotalPoints = 0
        };

        context.Users.Add(admin);
        context.SaveChanges();
    }

    private static List<QuestionTemplate> BuildQuestionTemplates(Attraction attraction, int quizId)
    {
        var now = DateTime.UtcNow;
        var ratingLabel = $"{Math.Round(attraction.Rating, 1).ToString("0.0", System.Globalization.CultureInfo.InvariantCulture)} / 5";
        var typeLabel = TranslateAttractionType(attraction.Type);

        return new List<QuestionTemplate>
        {
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = $"Care este caracteristica principală a {attraction.Name}?",
                    PointsValue = 10,
                    Order = 1,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new("Frumusețe și importanță istorică", true),
                    new("Zgomot și poluare", false),
                    new("Lipsă totală de vizitatori", false)
                }),
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = $"În ce regiune se află {attraction.Name}?",
                    PointsValue = 8,
                    Order = 2,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new(attraction.Region, true),
                    new("Dobrogea", false),
                    new("Banat", false)
                }),
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = $"Ce tip de experiență oferă {attraction.Name}?",
                    PointsValue = 12,
                    Order = 3,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new(typeLabel, true),
                    new("Destinație industrială", false),
                    new("Centru comercial modern", false)
                }),
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = $"Ce scor de recomandare are {attraction.Name}?",
                    PointsValue = 10,
                    Order = 4,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new(ratingLabel, true),
                    new("2.1 / 5", false),
                    new("3.4 / 5", false)
                }),
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = $"Adevărat sau Fals: {attraction.Name} contribuie la promovarea turismului românesc.",
                    PointsValue = 8,
                    Order = 5,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new("Adevărat", true),
                    new("Fals", false)
                }),
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = $"Adevărat sau Fals: {attraction.Name} este complet necunoscută vizitatorilor.",
                    PointsValue = 8,
                    Order = 6,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new("Adevărat", false),
                    new("Fals", true)
                })
        };
    }

    private static string TranslateAttractionType(AttractionType type) => type switch
    {
        AttractionType.Natural => "atracție naturală iconică",
        AttractionType.Cultural => "loc cultural vibrant",
        AttractionType.Historic => "sit istoric emblematic",
        AttractionType.Entertainment => "destinație de divertisment",
        AttractionType.Religious => "loc de pelerinaj celebru",
        _ => "destinație turistică"
    };

    private sealed record QuestionTemplate(Question Question, List<AnswerTemplate> Answers);
    private sealed record AnswerTemplate(string Text, bool IsCorrect);
}
