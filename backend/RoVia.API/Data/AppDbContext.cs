using Microsoft.EntityFrameworkCore;
using RoVia.API.Models;

namespace RoVia.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<Attraction> Attractions { get; set; }
    public DbSet<Quiz> Quizzes { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<Answer> Answers { get; set; }
    public DbSet<UserProgress> UserProgresses { get; set; }
    public DbSet<Badge> Badges { get; set; }
    public DbSet<UserBadge> UserBadges { get; set; }
    public DbSet<PromoterApplication> PromoterApplications { get; set; }
    public DbSet<AttractionSuggestion> AttractionSuggestions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "Visitor" },
            new Role { Id = 2, Name = "Promoter" },
            new Role { Id = 3, Name = "Administrator" }
        );

        modelBuilder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        // Quiz relationships
        modelBuilder.Entity<Quiz>()
            .HasMany(q => q.Questions)
            .WithOne(qt => qt.Quiz)
            .HasForeignKey(qt => qt.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Quiz>()
            .HasOne(q => q.CreatedByUser)
            .WithMany(u => u.Quizzes)
            .HasForeignKey(q => q.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Question>()
            .HasMany(qt => qt.Answers)
            .WithOne(a => a.Question)
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Attraction>()
            .HasOne(a => a.CreatedByUser)
            .WithMany(u => u.CreatedAttractions)
            .HasForeignKey(a => a.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // User Progress
        modelBuilder.Entity<UserProgress>()
            .HasOne(up => up.User)
            .WithMany()
            .HasForeignKey(up => up.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserProgress>()
            .HasOne(up => up.Quiz)
            .WithMany()
            .HasForeignKey(up => up.QuizId)
            .OnDelete(DeleteBehavior.NoAction);

        // Badges
        modelBuilder.Entity<UserBadge>()
            .HasOne(ub => ub.User)
            .WithMany()
            .HasForeignKey(ub => ub.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserBadge>()
            .HasOne(ub => ub.Badge)
            .WithMany(b => b.UserBadges)
            .HasForeignKey(ub => ub.BadgeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PromoterApplication>()
            .HasOne(pa => pa.User)
            .WithMany(u => u.PromoterApplications)
            .HasForeignKey(pa => pa.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PromoterApplication>()
            .HasOne(pa => pa.ReviewedBy)
            .WithMany(u => u.ReviewedApplications)
            .HasForeignKey(pa => pa.ReviewedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AttractionSuggestion>()
            .HasOne(s => s.Promoter)
            .WithMany(u => u.AttractionSuggestions)
            .HasForeignKey(s => s.PromoterId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AttractionSuggestion>()
            .HasOne(s => s.ReviewedBy)
            .WithMany()
            .HasForeignKey(s => s.ReviewedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AttractionSuggestion>()
            .HasOne(s => s.Attraction)
            .WithMany(a => a.Suggestions)
            .HasForeignKey(s => s.AttractionId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
